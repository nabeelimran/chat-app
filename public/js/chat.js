const socket = io()

const form = document.querySelector('#form')
const input = form.querySelector('#input')
const formButton = form.querySelector('#send')
const locationButton = document.querySelector('#send-location')
const messages = document.querySelector('#message')

const messageTemplate = document.querySelector('#message-template').innerHTML
const urlTemplate = document.querySelector('#url-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix : true })

const scrollToBottom = () => {
    const $newMessage = messages.lastElementChild
    const newMessageHeight = $newMessage.offsetHeight + parseInt(getComputedStyle($newMessage).marginBottom)
    //visible height
    const visibleHeight = messages.offsetHeight
    //container height
    const containerHeight = messages.scrollHeight
    //scroll offset
    const scrollOffset = messages.scrollTop + visibleHeight

    if ( containerHeight-newMessageHeight <= scrollOffset ) {
        messages.scrollTop = messages.scrollHeight
    }
}

socket.on('message', ({username, message, createdAt}) => {
    console.log(message)
    const html = Mustache.render(messageTemplate,{
        username,
        message,
        createdAt: moment(createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend',html)
    scrollToBottom()
})

socket.on('locationMessage', ({username, location, createdAt}) => {
    console.log(location)
    const html = Mustache.render(urlTemplate, {
        username,
        location,
        createdAt: moment(createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend',html)
    scrollToBottom()
})

socket.on('listUpdate', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

form.addEventListener('submit', (e) => {
    e.preventDefault()
    formButton.setAttribute('disabled', 'disabled')
    socket.emit('sendMessage', input.value, (error) => {
        formButton.removeAttribute('disabled')
        input.value = ''
        input.focus()
        if (error) {
            return swal({
                title: error,
                icon: 'error'
            })
        }
        console.log('Delivered')
    })
})
locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert('Your browser does not support geolocation!')
    }
    locationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition(({coords}) => {
        socket.emit('sendLocation', {latitude: coords.latitude, longitude: coords.longitude}, () => {
            locationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if (error) {
        swal({
            title: error,
            icon: 'error'
        }).then(() => location.href = '/')
        
    }
})