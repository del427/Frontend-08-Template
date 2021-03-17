
const css = require('css');
const EOF = Symbol('EOF');
let currentToken = null;
let currentAttribute =  null;
let stack = [{type:'document',children:[]}];
let currentTextNode = null;
let rules = [];
function addCSSRules(text) {
    var ast = css.parse(text);
    // console.log(JSON.stringify(ast,null,"   "));
    rules.push(...ast.stylesheet.rules)
}
function computeCss (element) {
    // console.log(rules);
    // console.log('compute css for element',element)
    var elements = stack.slice().reverse();

    if(!element.computedStyle){
        element.computedStyle = {}
    }

    for(let rule of rules){
        var selectorParts = rule.selectors[0].split(" ").reverse();
        if(!match(element,selectorParts[0])){
            continue;
        }

        let matched = false;

        var j = 1;
        for(let i= 0; i<elements.length;i++){
            if(match(elements[i],selectorParts[j])){
                j++
            }
        }

        if(j >= selectorParts.length){
            matched = true;
        }

        if(matched){
            const sp = specificity(rule.selectors[0]);
           var computedStyle = element.computedStyle;
             for (let del of rule.declarations) {
                if (!computedStyle[del.property]) {
                    computedStyle[del.property] = {};
                }

                if (!computedStyle[del.property].specificity) {
                    computedStyle[del.property].value = del.value;
                    computedStyle[del.property].specificity = sp;
                } else if (compare(computedStyle[del.property].specificity, sp) < 0) {
                    computedStyle[del.property].value = del.value;
                    computedStyle[del.property].specificity = sp;
                }
            }
           console.log(element.computedStyle)
        }
    }
}
function match(element, selector) {
    if (!selector || !element.attributes) {
        return false;
    }

    if (selector.charAt(0) === "#") {
        const attr = element.attributes.filter(attr => attr.name === "id")[0];
        if (attr && attr.value === selector.replace("#", "")) {
            return true;
        }
    } else if (selector.charAt(0) === ".") {
        const attr = element.attributes.filter(attr => attr.name === "class")[0];
        if (attr && attr.value === selector.replace(".", "")) {
            return true;
        }
    } else {
        if (element.tagName === selector) {
            return true;
        }
    }

    return false;
}
function specificity(selector) {
    let p = [0, 0, 0, 0];
    const selectorParts = selector.split(" ");
    for (let part of selectorParts) {
        if (part.charAt(0) === "#") {
            p[1] += 1;
        } else if (part.charAt(0) === ".") {
            p[2] += 1;
        } else {
            p[3] += 1;
        }
    }

    return p;
}

function compare(sp1, sp2) {
    if (sp1[0] - sp2[0]) {
        return sp1[0] - sp2[0];
    }

    if (sp1[1] - sp2[1]) {
        return sp1[1] - sp2[1];
    }

    if (sp1[2] - sp2[2]) {
        return sp1[2] - sp2[2];
    }

    return sp1[3] - sp2[3];
}

function emit(token){
  
    let top = stack[stack.length -1 ];
    if(token.type == 'startTag'){
        let element = {
            type:'element',
            children:[],
            attributes:[],
        };

        element.tagName = token.tagName;

        for(let p in token){
            if(p != 'type'  && p != 'tagName'){
                element.attributes.push({
                    name:p,
                    value:token[p]
                })
            }
        }
        computeCss(element)
        top.children.push(element);
        element.parent = top;

        if(!token.isSelfClosing){
            stack.push(element);;
        }

        currentTextNode = null;

    }else if(token.type == 'endTag'){
        if(top.tagName != token.tagName){
            throw new Error("Tag start end doesn't match!")
        }else {
            if(top.tagName == 'style'){
                addCSSRules(top.children[0].content)
            }
            stack.pop();
        }
        currentTextNode = null;
    }else if(token.type == 'text'){
        if(currentTextNode == null){
            currentTextNode = {
                type:'text',
                content:'',
            }
            top.children.push(currentTextNode)
        }
        currentTextNode.content += token.content;
    }
}


function data(c) {
    if(c == '<'){
        return tagOpen;
    }else if(c == EOF){
        emit({
            type:"EOF"
        })
        return ;
    }else{
        emit({
            type:'text',
            content:c
        })
        return data;
    }
}
function tagOpen(c) {
    if(c == '/'){
        return endTagOpen;
    }else if(c.match(/^[a-zA-Z]$/)){
        currentToken = {
            type:'startTag',
            tagName:'',
        }
        return tagName(c);
    }else {
        return 
    }
}
function endTagOpen(c) {
    if(c.match(/^[a-zA-Z]$/)){
        currentToken = {
            type:'endTag',
            tagName:''
        }
        return tagName(c);
    }else if( c == '>'){

    }else if( c == EOF){

    }else{

    }
}
function tagName(c) {
    if(c.match(/^[\t\n\f ]$/)){
        return beforeAttributeName;
    }else if( c== 'f'){
        return selfClosingStartTag;
    }else if(c.match(/^[a-zA-Z]$/)){
        currentToken.tagName += c;
        return tagName
    }else if(c == '>'){
        emit(currentToken)
        return data
    }else {
        return tagName;
    }
}

function beforeAttributeName(c){
    if(c.match(/^[\t\n\f ]$/)){
        return beforeAttributeName;
    }else if(c == '/' || c == '>' || c == EOF){
        return afterAttributeName(c);
    }else if( c == ''){

    }else {
        currentAttribute = {
            name:'',
            value:''
        };
        return attributeName(c)
    }
}

function attributeName(c){
    if(c.match(/^[\t\n\f ]$/) || c == '/' || c == '>' || c == EOF){
        return afterAttributeName(c)
    }else if(c == '='){
        return beforeAttributeValue;
    }else if(c == '\u0000'){
        
    }else if(c == "\"" || c == "'" || c == "<"){

    }else{
        currentAttribute.name += c;
        return attributeName;
    }
}

function beforeAttributeValue(c){
    if(c.match(/^[\t\n\f ]$/) || c == "/" || c == ">" || c == EOF){
        return beforeAttributeValue;
    }else if( c == "\""){
        return doubleQuoteAttributeValue;
    }else if( c == "\'"){
        return singleQuotedAttributeValue;
    }else if(c == ">"){

    }else{
        return UnquotedAttributeValue(c);
    }
}

function doubleQuoteAttributeValue(c) {
    if(c == "\""){
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuoteAttributeValue;
    }else if( c == "\u0000"){

    }else if( c == EOF){

    }else {
        currentAttribute.value += c;
        return doubleQuoteAttributeValue
    }
}

function singleQuotedAttributeValue (c){
    if(c == "\""){
        currentToken[currentAttribute.name] == currentAttribute.value;
        return afterQuoteAttributeValue;
    }else if( c == '\u0000'){

    }else if( c == EOF){
        
    }else {
        currentAttribute.value += c;
        return doubleQuoteAttributeValue
    }
}

function afterQuoteAttributeValue (c){
    if(c.match(/^[\t\n\f ]$/)){
        return beforeAttributeName;
    }else if(c== "/"){
        return selfClosingStartTag;
    }else if( c == ">"){
        currentToken[currentAttribute.value]= currentAttribute.value;
        emit(currentToken)
    }else if( c==EOF){

    }else {
        currentAttribute.value += c;
        return doubleQuoteAttributeValue
    }
}

function UnquotedAttributeValue(c) {
    if(c.match(/^[\t\n\f ]$/)){
        currentToken[currentAttribute.name] = currentAttribute.value;
        return beforeAttributeName;
    }else if( c == "/"){
        currentToken[currentAttribute.name] = currentAttribute.value;
        return selfClosingStartTag
    }else if( c == '>'){
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken)
        return data
    }else if( c == '\u0000'){

    }else if( c == "\"" || c == "'" || c == "<" || c == '=' || c == "'"){

    }else if(c == EOF){

    }else {
        currentAttribute.value += c;
        return UnquotedAttributeValue
    }
}

function afterAttributeName(w) {
    if (w.match(/^[\t\n\f ]$/)) {
        return afterAttributeName;
    } else if (w === "/") {
        return selfClosingStartTag;
    } else if (w === "=") {
        return beforeAttributeValue;
    } else if (w === ">") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if (w === EOF) {

    } else {
        currentToken[currentAttribute.name] = currentAttribute.value;
        currentAttribute = {
            name: "",
            value: ""
        };
        return attributeName(w);
    }
}


function selfClosingStartTag(c){
    if(c == '>'){
        currentToken.isSelfClosing = true;
        return data;
    }else if(c == 'EOF'){

    }else {

    }
}

module.exports.parseHTML = function parseHTML (html) {
    let state = data;
    for(let c of html){
        state = state(c)
    }
    state = state(EOF);
    return stack[0]
    // console.log(stack[0])
}