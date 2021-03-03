const net = require('net');
const { parse } = require('path');

class Request{
    constructor(options){
        this.method = options.method || 'GET';
        this.host = options.host;
        this.port = options.port || 80;
        this.path = options.path || '/';
        this.body = options.body || {};
        this.headers = options.headers || {};
        if(!this.headers['Content-Type']){
            this.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }    
        if(this.headers['Content-Type'] == 'application/json'){
            this.bodyText = JSON.stringify(this.body)
        }else if(this.headers['Content-Type'] == 'application/x-www-form-urlencoded'){
            this.bodyText = Object.keys(this.body).map(key => `${key}=${encodeURIComponent(this.body[key])}`).join('&')
        }
        this.headers['Content-Length'] = this.bodyText.length;
            
        
    }
    send(connection) {
      
    }
    toString() {
       
    }
}

void async function () {
    let request = new Request({
        method:'POST',
        host:'127.0.0.1',
        port:'8080',
        path:'/',
        headers:{
            ['X-F002']:'customed'
        },
        body:{
            name:'winter'
        }
    });
    let response = await request.send();
    console.log(response)
}()