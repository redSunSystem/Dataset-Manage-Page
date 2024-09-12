import {ElMessage, ElNotification,} from 'element-plus'
export const showElMessage = (message, type, duration, isPlain, showClose= true) => {
    ElMessage({
        message: message,
        type: type,
        duration: duration,
        plain: isPlain,
        showClose: showClose,
        center: true,
    })
}
export const showElNotification = (title, message, type, duration, position, showClose = true) => {
    ElNotification({
        title: title,
        message: message,
        type: type,
        duration: duration,
        position: position,
        showClose: showClose,
    })
}
