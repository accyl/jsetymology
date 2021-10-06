(window as any).universe = { batchIndex: 0 };

(window as any).doc = undefined;

declare function cy(): cytoscape.Core;


type num = number;
type str = string;
type bool = boolean;

type Section = wtf.default.Section;

// function print(obj: any, str = '') {
//     if (str) console.log(str);
//     if (obj) console.log(obj);
// }
function assert(x: any, message = '', hard = true) {
    if (!x) if (hard) throw TypeError(message); else console.warn(message);
}

function friendlyBreak(top = true) {
    let br = document.createElement('br');
    if (top) {
        $('#closeinspect')[0].prepend(br); // put as first child
    } else {
        $('#closeinspect')[0].appendChild(br);
    }
}
function friendlyInfo(str: string, override = true, top = true, color='black;') {
    if (override) $('#closeinspect')[0].innerHTML = '';

    let txt = document.createTextNode(str);
    let span = document.createElement('span');
    span.setAttribute(`style`, `color: ${color}`); // font-style: italic; 
    span.appendChild(txt);
    if (top) {
        $('#closeinspect')[0].prepend(span); // put as first child
    } else {
        $('#closeinspect')[0].appendChild(span);
    }

}

function friendlyError(str: string, override = true, top=true, ital=false) {
    friendlyInfo(str, override, top, `red;${ital ? ' font-style=italic;' : ''}`)

}
// let mw = wtf.default;