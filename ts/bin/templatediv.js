"use strict";
// let mw = wtf.default;
// import wtf from 'https://unpkg.com/wtf_wikipedia';
// / <reference path='https://unpkg.com/wtf_wikipedia'/>
// https://unpkg.com/wtf_wikipedia@9.0.1/builds/wtf_wikipedia-client.min.js
// @ts-ignore
// let wth = wtf as typeof wtt.default; // HOLY SH*T THIS ONE LINE IS SO F*CKING OBNOXIOUS
// wtf.extend(require('wtf-plugin-html'))
// @ts-ignore
// wtf.extend(wtfHtml);
function clearDiv() {
    $('#closeinspect')[0].innerHTML = '';
}
function appendToDiv(entry) {
    // TODO plop a link here for easy access
    if (!entry || entry instanceof EtyEntry && !entry.ety) {
        friendlyError(`<i>No etymology found. (Perhaps it\'s lemmatized?)</i>`, true);
        return false;
    }
    let sec = entry instanceof EtyEntry ? entry.ety : entry;
    let t = sec.wikitext();
    // t = t.replace(/#/g, '\n');
    // $('#closeinspect')[0].textContent = t ? t : '';
    // let temps = sec!.templates();
    // let idxs = getIndices(sec!);
    let [idxs, lens] = getTemplates(t);
    let start = 0, end = 0;
    assert(idxs.length === idxs.length);
    // if(override) {
    // clearDiv();
    // } else {
    // }
    for (let i = 0; i < idxs.length; i++) {
        let idx = idxs[i];
        end = idx;
        let text = document.createTextNode(t.slice(start, end));
        let textbox = document.createElement('span');
        textbox.appendChild(text);
        $('#closeinspect')[0].appendChild(textbox);
        start = end;
        end = start + lens[i];
        let ttext = t.slice(start, end);
        let ttextNode = document.createTextNode(ttext);
        let template = document.createElement('span');
        // template.setAttribute('style', 'background-color: #FF000022;');
        template.appendChild(ttextNode);
        template.classList.add('template');
        template.classList.add(findRelevance(ttext) ? 't-active' : 't-inactive'); // requires a dependency on template.ts
        template.onclick = () => onTemplateClicked(template);
        $('#closeinspect')[0].appendChild(template);
        start = end;
    }
    friendlyBreak(false);
    return true;
}
function templTknr(inp, startidx, nests) {
    // TODO reuse this to recognize cogs
    assert(inp[startidx] === '{' && inp[startidx + 1] === '{');
    for (let i = startidx + 2; i < inp.length; i++) {
        let c = inp[i];
        if (c === '{') {
            if (inp[i + 1] && inp[i + 1] === '{') {
                let [segm, newidx] = templTknr(inp, i, nests);
                assert(segm, "bad template!");
                nests.push(segm);
                i = newidx;
            }
            else
                continue;
        }
        else if (c === '}') {
            if (inp[i + 1] && inp[i + 1] === '}') {
                return [inp.substring(startidx, i + 2), i + 2];
            }
            else
                continue;
        }
    }
    return ['', startidx];
}
function getTemplates(sec) {
    // somehow this custom naive function works better, as {{cog}} are ignored. 
    // See https://github.com/spencermountain/wtf_wikipedia/issues/432
    let plain = typeof sec === 'string' ? sec : sec.wikitext();
    let idxs = [];
    let lens = [];
    for (let i = 0; i < plain.length; i++) {
        let char = plain[i];
        if (char === '{' && plain[i + 1] && plain[i + 1] === '{') {
            let nests = [];
            let [templ, newidx] = templTknr(plain, i, nests);
            if (templ) {
                idxs.push(i);
                lens.push(templ.length);
                i = newidx;
            }
            continue;
        }
    }
    return [idxs, lens];
}
function onTemplateClicked(templ) {
    if (!$('#tb-toggle').is(':checked'))
        return;
    // templ.setAttribute('style', 'background-color: #FF000022;');
    let isActive = !!templ.classList.contains('t-active');
    if (isActive)
        templ.classList.remove('t-active');
    if (!isActive)
        templ.classList.remove('t-inactive');
    templ.classList.add(isActive ? 't-inactive' : 't-active');
}
function onCheckbox() {
    if ($('#tb-toggle').is(':checked')) {
        // $('.template').addClass('noSelect');
    }
    else {
        $('.template').removeClass('noSelect');
    }
}