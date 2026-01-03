// 祈愿应用主逻辑
const { createApp, ref, computed, onUnmounted } = Vue

const students = studentsList.split(',')

// Cookie 工具函数
function setCookie(name, value, days = 365) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString()
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`
}

function getCookie(name) {
    const nameEQ = `${name}=`
    const ca = document.cookie.split(';')
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) === ' ') c = c.substring(1, c.length)
        if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length))
    }
    return null
}

function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

function clearAllCookies() {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i]
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : ''
        if (name) {
            deleteCookie(name)
        }
    }
}

createApp({
    setup() {
        // 从Cookie读取设置
        const savedLanguage = getCookie('currentLanguage')
        const savedSkipAnimation = getCookie('skipAnimation')
        const savedSoundEnabled = getCookie('soundEnabled')
        
        // 语言管理
        const currentLanguage = ref(savedLanguage || 'zh')
        
        // 缓存当前语言的翻译对象
        const currentMessages = ref(window.i18n?.messages?.[currentLanguage.value] || {})
        
        // 翻译函数 - 使用缓存优化
        const t = (key) => {
            return currentMessages.value[key] || key
        }
        
        // 从Cookie读取历史记录
        const savedHistory = getCookie('historyList')
        const parsedHistory = savedHistory ? JSON.parse(savedHistory) : []
        
        // 祈愿核心逻辑状态
        const historyList = ref(parsedHistory)
        const myVideo = ref(null)
        const message = ref('')
        const isShow = ref(false)
        const studentsBoxShow = ref(false)
        const skipAnimation = ref(savedSkipAnimation ? savedSkipAnimation === 'true' : false)
        const soundEnabled = ref(savedSoundEnabled ? savedSoundEnabled === 'true' : true)
        let id = 0
        const thisName = ref('')
        const nameShow = ref(false)
        const nameClass = ref(['result-name'])
        
        // 设置面板状态
        const showSettings = ref(false)
        
        // 保存历史记录到Cookie的函数 - 添加防抖机制
        let saveTimer = null
        const MAX_HISTORY_LENGTH = 100 // 限制历史记录最大长度
        
        const saveHistoryToCookie = () => {
            // 限制历史记录长度
            if (historyList.value.length > MAX_HISTORY_LENGTH) {
                historyList.value = historyList.value.slice(-MAX_HISTORY_LENGTH)
            }
            
            // 防抖：延迟100ms保存，避免频繁写入
            if (saveTimer) {
                clearTimeout(saveTimer)
            }
            saveTimer = setTimeout(() => {
                setCookie('historyList', JSON.stringify(historyList.value))
                saveTimer = null
            }, 100)
        }
        
        // 语言切换逻辑
        const changeLanguage = () => {
            console.log('语言已切换为:', currentLanguage.value)
            // 更新缓存的翻译对象
            currentMessages.value = window.i18n?.messages?.[currentLanguage.value] || {}
            // 将语言设置保存到cookie
            setCookie('currentLanguage', currentLanguage.value)
        }
        
        // 设置面板切换
        const toggleSettings = () => {
            showSettings.value = !showSettings.value
        }
        
        // 清除Cookie功能
        const clearCookies = () => {
            if (confirm('确定要清除所有设置吗？')) {
                clearAllCookies()
                // 重置设置为默认值
                currentLanguage.value = 'zh'
                skipAnimation.value = false
                soundEnabled.value = true
                alert('Cookie已清除，设置已重置为默认值')
            }
        }
        // 历史记录和统计面板状态
        const showHistory = ref(false)
        const showStats = ref(false)
        const flashKey = ref(0)
        const currentTime = computed(() => {
            const now = new Date()
            return now.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
        })
        
        // 统计数据计算
        const statsList = computed(() => {
            // 统计每个人的抽中次数
            const stats = {}
            historyList.value.forEach(item => {
                stats[item.name] = (stats[item.name] || 0) + 1
            })
            
            // 转换为数组并排序
            let statsArray = Object.entries(stats).map(([name, count]) => {
                return {
                    name,
                    count,
                    percentage: 0
                }
            })
            
            // 按抽中次数降序排序
            statsArray.sort((a, b) => b.count - a.count)
            
            // 计算百分比
            const total = historyList.value.length
            if (total > 0) {
                statsArray.forEach(item => {
                    item.percentage = (item.count / total) * 100
                })
            }
            
            return statsArray
        })
        
        // 抽中次数最多的人
        const topStudent = computed(() => {
            if (statsList.value.length === 0) {
                return { name: '暂无数据', count: 0 }
            }
            return statsList.value[0]
        })
        
        // 十连抽相关变量
        const tenDrawResults = ref([])
        const isTenDraw = ref(false)
        const tenDrawIndex = ref(0)
        const showTenDrawResult = ref(false)
        
        let timer = null
        
        // 简化setTimer函数，因为已经移除了动画效果
        function setTimer (){
            // 直接添加active类，不再使用定时器
            nameClass.value.push('active')
        }
        
        function removeI(item){
            let index = nameClass.value.indexOf(item)
            if(index!=-1){
                nameClass.value.splice(index,1)
            }
        }

        // 随机数生成函数
        function makeRandom(min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min)
        }

        // 优化概率调整逻辑，减少重复代码
        function getStudentsWithProbability() {
            // 创建一个临时列表，将张易杨的概率提升一倍
            let tempStudents = [...students]
            const targetName = '张易杨'
            const targetIndex = students.indexOf(targetName)
            if (targetIndex !== -1) {
                // 如果列表中包含张易杨，则复制一份增加到列表中
                tempStudents.push(targetName)
            }
            return tempStudents
        }
        
        // 预计算概率调整后的学生列表，避免重复计算
        const probabilityStudents = getStudentsWithProbability()
        
        function drawName() {
            // 使用优化后的概率调整逻辑
            // 从预计算的列表中随机抽取
            id = makeRandom(0, probabilityStudents.length - 1)
            thisName.value = probabilityStudents[id]
        }

        function asn() {
            isShow.value = false
            studentsBoxShow.value = true
            nameShow.value = true
            // 移除动画，直接显示结果，提高性能
            nameClass.value = ['result-name', 'active']
            drawName()
        }

        function init(){
            isShow.value = false
            studentsBoxShow.value = false
            nameShow.value = false
            showHistory.value = false
            removeI('active')
            // 重置十连抽状态
            resetTenDraw()
        }
        
        const handleDrew = ()=>{
            if (skipAnimation.value) {
                // 跳过动画，直接显示结果
                asn()
                historyList.value.push({
                    name: thisName.value,
                    time: currentTime.value
                })
                saveHistoryToCookie() // 保存到Cookie
            } else {
                // 播放动画
                isShow.value = true
                // 尝试播放视频，处理自动播放限制
                if (myVideo.value) {
                    myVideo.value.play().catch(error => {
                        console.log('视频自动播放失败:', error)
                        // 当自动播放失败时，直接跳过动画，显示结果
                        isShow.value = false
                        asn()
                        historyList.value.push({
                            name: thisName.value,
                            time: currentTime.value
                        })
                        saveHistoryToCookie() // 保存到Cookie
                    })
                } else {
                    // 如果视频元素不存在，直接显示结果
                    asn()
                    historyList.value.push({
                        name: thisName.value,
                        time: currentTime.value
                    })
                    saveHistoryToCookie() // 保存到Cookie
                }
            }
        }

        const VideoEnd = () => {
            if (isTenDraw.value) {
                // 十连抽动画结束
                tenDrawResults.value = drawTenNames()
                studentsBoxShow.value = true
                nameShow.value = true
                showTenDrawResult.value = false // 初始不显示全部结果
                setTimer()
                thisName.value = tenDrawResults.value[0]
                tenDrawIndex.value = 1
                
                // 添加到历史记录
                tenDrawResults.value.forEach(name => {
                    historyList.value.push({
                        name: name,
                        time: currentTime.value
                    })
                })
                saveHistoryToCookie() // 保存到Cookie
            } else {
                // 单次祈愿动画结束
                asn()
                historyList.value.push({
                    name: thisName.value,
                    time: currentTime.value
                })
                saveHistoryToCookie() // 保存到Cookie
            }
        }
        
        const toggleHistory = () => {
            showHistory.value = !showHistory.value
        }
        
        const toggleStats = () => {
            showStats.value = !showStats.value
        }
        
        const shareResult = () => {
            // 简单的分享功能实现
            const shareText = t('shareText').replace('{name}', thisName.value).replace('{time}', currentTime.value)
            if (navigator.share) {
                navigator.share({
                    title: isTenDraw.value ? t('tenResultTitle') : t('resultTitle'),
                    text: shareText
                })
            } else {
                // 复制到剪贴板
                navigator.clipboard.writeText(shareText)
                    .then(() => {
                        alert(t('copySuccess'))
                    })
            }
        }
        
        const drawAgain = () => {
            // 直接再次祈愿
            thisName.value = ''
            removeI('active')
            
            if (isTenDraw.value) {
                // 十连抽模式下，重新生成十连抽结果
                tenDrawResults.value = drawTenNames()
                thisName.value = tenDrawResults.value[0]
                tenDrawIndex.value = 1
                showTenDrawResult.value = false
                
                // 添加所有新结果到历史记录
                tenDrawResults.value.forEach(name => {
                    historyList.value.push({
                        name: name,
                        time: currentTime.value
                    })
                })
            } else {
                // 单次祈愿模式
                drawName()
                // 添加到历史记录
                historyList.value.push({
                    name: thisName.value,
                    time: currentTime.value
                })
            }
            
            setTimer()
            // 更新闪光效果key，触发闪光效果
            flashKey.value++
            saveHistoryToCookie() // 保存到Cookie
        }
        
        // 十连抽相关函数 - 使用预计算的概率列表
        function drawTenNames() {
            const results = []
            for (let i = 0; i < 10; i++) {
                // 从预计算的概率调整列表中随机抽取
                id = makeRandom(0, probabilityStudents.length - 1)
                results.push(probabilityStudents[id])
            }
            return results
        }
        
        const handleTenDrew = () => {
            // 首先设置为十连抽模式，确保所有逻辑都基于此状态
            isTenDraw.value = true
            
            if (skipAnimation.value) {
                // 重置所有相关状态
                tenDrawResults.value = []
                tenDrawIndex.value = 0
                showTenDrawResult.value = false
                
                // 跳过动画，直接显示十连抽结果
                tenDrawResults.value = drawTenNames()
                nameShow.value = true // 显示结果名称
                thisName.value = tenDrawResults.value[0] // 设置第一个结果
                tenDrawIndex.value = 1 // 设置索引为1
                
                setTimer() // 触发动画效果
                
                // 添加到历史记录
                tenDrawResults.value.forEach(name => {
                    historyList.value.push({
                        name: name,
                        time: currentTime.value
                    })
                })
                saveHistoryToCookie() // 保存到Cookie
                
                // 最后显示结果界面，确保所有状态都已更新
                studentsBoxShow.value = true
                showTenDrawResult.value = true
            } else {
                // 播放动画
                isShow.value = true
                // 尝试播放视频，处理自动播放限制
                myVideo.value.play().catch(error => {
                    console.log('视频自动播放失败:', error)
                    // 当自动播放失败时，直接跳过动画，显示结果
                    isShow.value = false
                    
                    // 重置所有相关状态
                    tenDrawResults.value = []
                    tenDrawIndex.value = 0
                    showTenDrawResult.value = false
                    
                    // 跳过动画，直接显示十连抽结果
                    tenDrawResults.value = drawTenNames()
                    nameShow.value = true // 显示结果名称
                    thisName.value = tenDrawResults.value[0] // 设置第一个结果
                    tenDrawIndex.value = 1 // 设置索引为1
                    
                    setTimer() // 触发动画效果
                    
                    // 添加到历史记录
                    tenDrawResults.value.forEach(name => {
                        historyList.value.push({
                            name: name,
                            time: currentTime.value
                        })
                    })
                    saveHistoryToCookie() // 保存到Cookie
                    
                    // 最后显示结果界面，确保所有状态都已更新
                    studentsBoxShow.value = true
                    showTenDrawResult.value = true
                })
            }
        }
        
        const showNextTenDrawResult = () => {
            if (tenDrawIndex.value < tenDrawResults.value.length) {
                thisName.value = tenDrawResults.value[tenDrawIndex.value]
                tenDrawIndex.value++
                nameShow.value = false
                removeI('active')
                setTimeout(() => {
                    nameShow.value = true
                    setTimer()
                    // 更新闪光效果key，触发闪光效果
                    flashKey.value++
                }, 100)
            } else {
                // 十连抽结束
                showTenDrawResult.value = true
            }
        }
        
        const resetTenDraw = () => {
            tenDrawResults.value = []
            isTenDraw.value = false
            tenDrawIndex.value = 0
            showTenDrawResult.value = false
        }
        
        const toInit = () => {
            thisName.value = ''
            init()
            resetTenDraw()
        }
        
        // 清空历史记录
        const clearHistory = () => {
            if (confirm('确定要清空历史记录吗？')) {
                historyList.value = []
            }
        }

        // 组件销毁时清理定时器
        onUnmounted(() => {
            if (timer !== null) {
                clearTimeout(timer)
                timer = null
            }
        })

        return {
            // 核心功能
            message,
            historyList,
            handleDrew,
            myVideo,
            isShow,
            VideoEnd,
            studentsBoxShow,
            thisName,
            nameShow,
            toInit,
            nameClass,
            showHistory,
            showStats,
            flashKey,
            currentTime,
            toggleHistory,
            toggleStats,
            shareResult,
            drawAgain,
            skipAnimation,
            handleTenDrew,
            tenDrawResults,
            showTenDrawResult,
            showNextTenDrawResult,
            isTenDraw,
            tenDrawIndex,
            clearHistory,
            topStudent,
            statsList,
            
            // 语言和设置功能
            currentLanguage,
            changeLanguage,
            showSettings,
            soundEnabled,
            toggleSettings,
            clearCookies,
            t 
        }
    }
}).mount('#app')
