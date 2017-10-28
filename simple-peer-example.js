var Peer = require('simple-peer')
var p = new Peer({ initiator: false, trickle: false })

p.on('error', function (err) {
    console.log('error', err)
})

p.on('signal', function (data) {
    console.log('SIGNAL', JSON.stringify(data))
    document.querySelector('#outgoing').textContent = JSON.stringify(data)
})

document.querySelector('form').addEventListener('submit', function (ev) {
    ev.preventDefault()
    p.signal(JSON.parse(document.querySelector('#incoming').value))
})

p.on('connect', function () {
    const chunk = 'whatever' + Math.random();
    p.send(chunk)
    document.querySelector('#data').textContent += "Sending: " + chunk + ";\n";
})

p.on('data', function (data) {
    document.querySelector('#data').textContent += "Received: " + data + ";\n";
})