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
        return new Promise((resolve,reject) => {
            const parser = new Responseparser;
            if(connection){
                connection.write(this.toString());
            }else{
                connection = net.createConnection({
                    host:this.host,
                    port:this.port
                },() => {
                    connection.write(this.toString())
                })
            }
           
            connection.on('data',(data) => {
                console.log(data.toString());
                parser.receive(data.toString());
                if(parse.isFinished){
                    resolve(parser.response);
                    connection.end()
                }
            })
            connection.on('error',(err) => {
                console.log(err,'err')
                reject(err);
                connection.end()
            })
        })
    }
    toString() {
        return `${this.method} ${this.path} HTTP/1.1\r
${Object.keys(this.headers).map(key => `${key}:${this.headers[key]}`).join('\r\n')}\r
        \r
        ${this.bodyText}`
    }
}


class Responseparser {
    constructor(){
        this.WAITING_STATUS_LINE = 0;
        this.WAITING_STATUS_LINE_END = 1;
        this.WAITING_HEADER_NAME = 2;
        this.WAITING_HEADER_SPACE = 3;
        this.WAITING_HEADER_VALUE = 4;
        this.WAITING_HEADER_LINE_END = 5;
        this.WAITING_HEADER_BLOCK_END = 6;
        this.WAITING_BODY = 7;

        this.current = this.WAITING_STATUS_LINE;
        this.statusLine = '';
        this.headers = {};
        this.headerName = '';
        this.headerValue = '';
        this.bodyParser = null;
    }
    get isFinished() {
        return this.bodyParser && this.bodyParser.isFinished
    }
    get response () {
        this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/)
        return {
            statusCode: RegExp.$1,
            statusText:RegExp.$2,
            headers:this.headers,
            body:this.bodyParser.content.join('')
        }
    }

    receive(string){
        for(let i = 0; i < string.length; i++){
            this.receiveChar(string.charAt(i))
        }
    }
    receiveChar(char) {

    }
    
}
void async function () {
    let request = new Request({
        method:'POST',
        host:'127.0.0.1',
        port:'8088',
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