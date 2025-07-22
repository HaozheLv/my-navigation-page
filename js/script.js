// 这里将是你所有的 JavaScript 逻辑代码
// 1. 时间显示更新
// 2. 搜索栏功能
// 3. 快速访问链接的添加、保存和显示（利用 localStorage）
// 4. 随机颜文字生成

// 在 js/script.js 的顶部或者一个合适的位置定义 Favicon 服务的基础 URL
// 示例服务：Google S2 Favicon API (公共且免费，但无SLA保证，仅限开发测试)
// 请注意：Google S2 Favicon Service 可能会有使用限制或未来停止服务
const FAVICON_SERVICE_URL = 'https://www.google.com/s2/favicons?sz=64&domain=';


// 示例：页面加载时执行的函数
document.addEventListener('DOMContentLoaded', () => {
    // console.log('导航页已加载！');

    // 更新时间
    updateDateTime(); // 页面加载时立即更新一次
    setInterval(updateDateTime, 1000); // 每1000毫秒（1秒）更新一次

    // 随机显示一个颜文字
    geneKaomoji();

    // 搜索引擎
    initCustomSearchSelect(); // 初始化自定义下拉菜单
    // initSearchBar(); // 确保这个函数现在使用 currentSearchEngineIndex 进行搜索


    // --- 快速跳转功能相关 JS ---
    const quickLinksGrid = document.querySelector('.quick-links-grid');
    const addLinkModal = document.getElementById('add-link-modal');
    const closeButton = document.querySelector('.modal .close-button');
    const addLinkForm = document.getElementById('add-link-form');
    const linkNameInput = document.getElementById('link-name');
    const linkUrlInput = document.getElementById('link-url');
    const cancelButton = document.getElementById('cancel-link-button');
    const saveLinkButton = document.getElementById('save-link-button'); // 新增：保存按钮

    const MAX_LINKS = 8; // 最大链接数量
    let links = JSON.parse(localStorage.getItem('quickLinks')) || []; // 从 localStorage 加载链接

    let currentAddButton = null; // 用于记录点击的是哪一个“加号”按钮
    let editingIndex = -1; // -1 表示不在编辑模式，>=0 表示正在编辑的链接索引

    let openOptionsMenu = null; // <--- 确保这一行在这里！

    // 函数：生成一个快速链接按钮的HTML元素
    function createLinkButton(linkData, index) {
        const linkButton = document.createElement('a');
        linkButton.href = linkData.url;
        linkButton.target = '_self';
        linkButton.classList.add('quick-link-button');
        // 添加一个数据属性来存储链接的索引，便于后续删除和编辑
        linkButton.dataset.index = index; 

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('quick-link-button-content');

        const img = document.createElement('img');
        // 默认图标，你需要准备一个 'assets/icons/link.png' 文件
        // 如果想让用户自定义图标，需要修改表单和这里

        img.alt = linkData.name;
        // --- 核心修改：自动获取 Favicon ---
    // 优先使用 linkData.icon (如果有用户自定义的)，否则尝试从服务获取
        if (linkData.icon) {
            img.src = linkData.icon;
        } else {
            // 构建 Favicon 服务的完整 URL
            // 对于 Google S2 Favicon API，只需传入域名
            // 对于 Favicon Kit，可能是 FAVICON_SERVICE_URL + new URL(linkData.url).hostname
            // 具体取决于你选择的服务
            try {
                const urlObj = new URL(linkData.url);
                // 确保只传递域名给 Favicon 服务，去除协议和路径
                const domain = urlObj.hostname; 
                img.src = `${FAVICON_SERVICE_URL}${domain}`; 
                
                // 备用：如果获取 Favicon 失败，显示默认图标
                // 这是为了处理 Favicon 服务可能无法找到或返回错误的情况
                img.onerror = () => {
                    img.src = 'assets/icons/link.png'; 
                };
                
            } catch (error) {
                console.error("Invalid URL for favicon:", linkData.url, error);
                img.src = 'assets/icons/link.png'; // URL 无效时也显示默认图标
            }
        }
        // --- 核心修改结束 ---

        // img.src = linkData.icon || 'assets/icons/link.png'; 
        

        const span = document.createElement('span');
        span.textContent = linkData.name;

        // --- 新增：更多选项按钮和下拉菜单 ---
        const optionsToggle = document.createElement('span');
        optionsToggle.classList.add('options-toggle');
        optionsToggle.textContent = '•••'; // 更多选项图标
        optionsToggle.title = '更多选项';

        const optionsMenu = document.createElement('div');
        optionsMenu.classList.add('options-menu');

        const editOption = document.createElement('div');
        editOption.classList.add('menu-option', 'edit-option');
        editOption.textContent = '编辑';
        editOption.addEventListener('click', (e) => {
            // e.stopPropagation(); // 阻止事件冒泡
            // --- 核心修改：添加 e.preventDefault() 并确保 e.stopPropagation() ---
            e.preventDefault(); // 阻止链接的默认跳转行为
            e.stopPropagation(); // 阻止事件冒泡到父链接按钮
            openEditModal(index);
            if (openOptionsMenu) {
                openOptionsMenu.style.display = 'none'; // 关闭菜单
                openOptionsMenu = null;
            }
        });

        const deleteOption = document.createElement('div');
        deleteOption.classList.add('menu-option', 'delete-option');
        deleteOption.textContent = '删除';
        deleteOption.addEventListener('click', (e) => {
            // e.stopPropagation(); // 阻止事件冒泡
            // --- 核心修改：添加 e.preventDefault() 并确保 e.stopPropagation() ---
            e.preventDefault(); // 阻止链接的默认跳转行为
            e.stopPropagation(); // 阻止事件冒泡到父链接按钮
            deleteLink(index);
            if (openOptionsMenu) {
                openOptionsMenu.style.display = 'none'; // 关闭菜单
                openOptionsMenu = null;
            }
        });

        optionsMenu.appendChild(editOption);
        optionsMenu.appendChild(deleteOption);

        // 点击更多选项图标显示/隐藏菜单
        optionsToggle.addEventListener('click', (e) => {
            e.preventDefault(); // 阻止默认链接行为
            e.stopPropagation(); // 阻止事件冒泡到父链接和 document

            // 如果有其他菜单打开，先关闭它
            if (openOptionsMenu && openOptionsMenu !== optionsMenu) {
                openOptionsMenu.style.display = 'none';
            }

            // 切换当前菜单的显示状态
            optionsMenu.style.display = (optionsMenu.style.display === 'block') ? 'none' : 'block';
            openOptionsMenu = optionsMenu.style.display === 'block' ? optionsMenu : null;
        });

        linkButton.appendChild(optionsToggle); // 将更多选项图标添加到按钮中
        linkButton.appendChild(optionsMenu); // 将菜单添加到按钮中 (CSS会定位它)
        // --- 新增结束 ---

        contentDiv.appendChild(img);
        contentDiv.appendChild(span);
        linkButton.appendChild(contentDiv);
        
        return linkButton;
    }

    // 函数：生成一个“加号”按钮的HTML元素 (保持不变)
    function createAddButton() {
        const addButton = document.createElement('a');
        addButton.href = '#';
        addButton.classList.add('quick-link-button', 'add-button');

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('quick-link-button-content');

        const plusSpan = document.createElement('span');
        plusSpan.classList.add('plus-icon');
        plusSpan.textContent = '+';

        contentDiv.appendChild(plusSpan);
        addButton.appendChild(contentDiv);

        addButton.addEventListener('click', (e) => {
            e.preventDefault();
            currentAddButton = addButton;
            editingIndex = -1; // 确保是添加模式
            addLinkModal.style.display = 'flex';
            linkNameInput.focus();
            addLinkForm.reset();
            saveLinkButton.textContent = '保存'; 
        });

        return addButton;
    }

    // 函数：渲染所有按钮 (核心逻辑)
    function renderButtons() {
        quickLinksGrid.innerHTML = ''; 

        links.forEach((link, index) => {
            quickLinksGrid.appendChild(createLinkButton(link, index)); 
        });

        if (links.length < MAX_LINKS) {
            quickLinksGrid.appendChild(createAddButton());
        }
    }

    // --- 删除链接的函数 (保持不变) ---
    function deleteLink(index) {
        if (confirm(`确定要删除链接“${links[index].name}”吗？`)) {
            links.splice(index, 1);
            localStorage.setItem('quickLinks', JSON.stringify(links));
            renderButtons();
        }
    }

    // --- 打开编辑模态框的函数 (保持不变) ---
    function openEditModal(index) {
        editingIndex = index;
        const linkToEdit = links[index];
        linkNameInput.value = linkToEdit.name;
        linkUrlInput.value = linkToEdit.url;
        addLinkModal.style.display = 'flex';
        linkNameInput.focus();
        saveLinkButton.textContent = '更新';
    }

    // 初始化渲染按钮 (页面加载时执行)
    renderButtons();

    // 模态框关闭事件 (保持不变)
    closeButton.addEventListener('click', () => {
        addLinkModal.style.display = 'none';
        addLinkForm.reset();
        editingIndex = -1; 
        saveLinkButton.textContent = '保存';
    });

    cancelButton.addEventListener('click', () => {
        addLinkModal.style.display = 'none';
        addLinkForm.reset();
        editingIndex = -1; 
        saveLinkButton.textContent = '保存';
    });

    // 点击模态框外部区域关闭 (保持不变)
    window.addEventListener('click', (event) => {
        if (event.target == addLinkModal) {
            addLinkModal.style.display = 'none';
            addLinkForm.reset();
            editingIndex = -1;
            saveLinkButton.textContent = '保存';
        }
        // 新增：点击页面其他地方关闭所有打开的选项菜单
        if (openOptionsMenu && !event.target.closest('.options-menu') && !event.target.closest('.options-toggle')) {
            openOptionsMenu.style.display = 'none';
            openOptionsMenu = null;
        }
    });

    // 表单提交事件 (保持不变)
    addLinkForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = linkNameInput.value.trim();
        let url = linkUrlInput.value.trim();

        if (url && !url.match(/^(https?:\/\/|ftps?:\/\/|mailto:|tel:)/i)) {
            url = 'http://' + url;
        }

        // if (name && url) {
        if (url) {
            const newLink = { name, url };

            if (editingIndex !== -1) {
                links[editingIndex] = newLink;
            } else {
                if (currentAddButton) {
                    const children = Array.from(quickLinksGrid.children);
                    const index = children.indexOf(currentAddButton);
                    if (index !== -1) {
                        links.splice(index, 0, newLink);
                    } else {
                        links.push(newLink);
                    }
                } else {
                    links.push(newLink);
                }
            }
            
            if (links.length > MAX_LINKS) {
                links = links.slice(0, MAX_LINKS);
            }

            localStorage.setItem('quickLinks', JSON.stringify(links));

            addLinkModal.style.display = 'none';
            addLinkForm.reset();
            currentAddButton = null;
            editingIndex = -1; 
            saveLinkButton.textContent = '保存';

            renderButtons();
        } else {
            alert('名称和链接都不能为空！');
        }
    });

});

// 你可以在这里定义各个功能的函数，例如：

// 日期时间函数
function updateDateTime(){
    var today = new Date();
    var DD = String(today.getDate()).padStart(2, '0'); // 获取日
    var MM = String(today.getMonth() + 1).padStart(2, '0'); //获取月份，1 月为 0
    var yyyy = today.getFullYear(); // 获取年
    // 时间
    hh =  String(today.getHours()).padStart(2, '0');       //获取当前小时数(0-23)
    mm = String(today.getMinutes()).padStart(2, '0');     //获取当前分钟数(0-59)
    ss = String(today.getSeconds()).padStart(2, '0');     //获取当前秒数(0-59)
    //today = yyyy + '-' + MM + '-' + DD + ' ' + hh + ':' + mm + ':' + ss;
    dt = yyyy + '-' + MM + '-' + DD;
    tm = hh + ':' + mm + ':' + ss
    document.getElementById("date").innerHTML=dt;
    document.getElementById("time").innerHTML=tm;
    // setTimeout(clock,500);
}

// 随机颜文字
function geneKaomoji(){
    var km=[
        "(＃°Д°)","(。_。)","...(*￣０￣)ノ","(￣m￣）","ㄟ( ▔, ▔ )ㄏ",
        "(ˉ﹃ˉ)","┑(￣Д ￣)┍","_(:з)∠)_","(ˉ▽￣～) 切~~","o(〃＾▽＾〃)o",
        "(￣_￣|||)","→_→","←_←","{{{(>_<)}}}","＞︿＜","(っ °Д °;)っ",
        "( *^-^)ρ(*╯^╰)","٩(๑´0`๑)۶","( ╯-_-)╯┴—┴","ᕕ( ᐛ )ᕗ","(꒪⌓꒪)",
        "o((>ω< ))o","￣へ￣","ψ(｀∇´)ψ","[]~(￣▽￣)~*"
    ];
    // var len=km.length;
    // document.getElementById("kaomoji-display").innerHTML=km[Math.floor(Math.random()*100)%km.length];
    var randomIndex = Math.floor(Math.random() * km.length);
    document.getElementById("kaomoji-display").innerHTML = km[randomIndex];
}

// 搜索引擎配置
const searchEngines = [
    { name: 'Bing', url: 'https://www.bing.com/search?q=', icon: 'assets/icons/search-icons/bing.svg' },
    { name: 'Google', url: 'https://www.google.com/search?q=', icon: 'assets/icons/search-icons/google.svg' },
    { name: '百度', url: 'https://www.baidu.com/s?wd=', icon: 'assets/icons/search-icons/baidu.svg' },
];
let currentSearchEngineIndex = 0; // 当前选中的搜索引擎索引

/* 下拉菜单控制函数 */
function initCustomSearchSelect() {
    const customDisplay = document.getElementById('custom-search-engine-display');
    const customOptions = document.getElementById('custom-search-engine-options');
    const customIcon = document.getElementById('custom-search-engine-icon');
    // const customName = document.getElementById('custom-search-engine-name');

    // 初始化显示当前选中的搜索引擎
    function updateDisplay(index) {
        currentSearchEngineIndex = index;
        const engine = searchEngines[currentSearchEngineIndex];
        customIcon.src = engine.icon;
        customIcon.alt = engine.name;
        // customName.textContent = engine.name;
    }

    // 渲染选项列表
    function renderOptions() {
        customOptions.innerHTML = ''; // 清空现有选项
        searchEngines.forEach((engine, index) => {
            const optionItem = document.createElement('div');
            optionItem.classList.add('option-item');
            optionItem.dataset.engineIndex = index; // 存储索引
            // optionItem.innerHTML = `<img src="${engine.icon}" alt="${engine.name}"><span>${engine.name}</span>`;
            optionItem.innerHTML = `<img src="${engine.icon}" alt="${engine.name}">`;

            optionItem.addEventListener('click', () => {
                updateDisplay(index);
                customOptions.classList.remove('show'); // 关闭下拉菜单
                customDisplay.classList.remove('open'); // 移除箭头旋转类
            });
            customOptions.appendChild(optionItem);
        });
    }

    // 点击头部，切换显示/隐藏列表
    customDisplay.addEventListener('click', () => {
        customOptions.classList.toggle('show');
        customDisplay.classList.toggle('open'); // 添加/移除类以旋转箭头
    });

    // 点击文档其他地方，关闭列表
    document.addEventListener('click', (event) => {
        if (!customDisplay.contains(event.target) && !customOptions.contains(event.target)) {
            customOptions.classList.remove('show');
            customDisplay.classList.remove('open');
        }
    });

    // 首次加载时更新显示并渲染选项
    updateDisplay(currentSearchEngineIndex);
    renderOptions();
}

/* 搜索函数 */
// function search(contents) {
//     window.open(searchEngines[currentSearchEngineIndex].url + contents);
// }

function search(contents) {
    // 构造完整的 URL
    const urlToOpen = searchEngines[currentSearchEngineIndex].url + contents;

    // 将当前窗口的 URL 设置为新的 URL，这会使页面在当前窗口加载
    window.location.href = urlToOpen;
}