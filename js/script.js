// 这里将是你所有的 JavaScript 逻辑代码
// 1. 时间显示更新
// 2. 搜索栏功能
// 3. 快速访问链接的添加、保存和显示（利用 localStorage）
// 4. 随机颜文字生成

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
    initSearchBar(); // 确保这个函数现在使用 currentSearchEngineIndex 进行搜索


    // 在这里调用你的各个初始化函数
    // initSearchBar();
    // loadAndDisplayQuickLinks(); // 加载并显示快速访问链接
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
function search(contents) {
    window.open(searchEngines[currentSearchEngineIndex].url + contents);
}
