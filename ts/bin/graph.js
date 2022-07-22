"use strict";
// const { data } = require("jquery");
// declare function relayout(cy?: cytoscape.Core, fromScratch?:bool): void;
function wlToTree(word, lang, target) {
    var _a;
    if (word === undefined)
        word = $('#qword').val();
    if (lang === undefined)
        lang = $('#qlang').val();
    let [oword, olang] = _parse(word, lang);
    if (window.jsetymologyDebug)
        console.log(`DEBUG ${oword}; ${olang}`);
    // TODO search for existing node in graph, to extract additional info like langcode, isRecon
    if (!target) {
        let targetarr = cy().$(`node[id="${oword}, ${olang}"]`);
        if (targetarr && targetarr.length) {
            target = targetarr[0];
        }
    }
    let isRecon, langcode;
    if (target) {
        isRecon = target.data().isRecon;
        langcode = target.data().langcode;
    }
    else {
        isRecon = Templates.isReconstructed(word, lang, langcode);
        // this fails in case olang is inferred
    }
    Etymology.fetchEtyEntry(word, lang, isRecon, ((_a = target === null || target === void 0 ? void 0 : target.data()) === null || _a === void 0 ? void 0 : _a.wikitext) ? wtf(target.data().wikitext) : undefined)
        .then(function onEtyEntry(out) {
        if (!out)
            return;
        let [data2, doc] = out;
        window.etyentries = data2;
        if (!data2 || data2.length === 0)
            throw "No entries found!";
        clearDiv();
        let orig;
        for (let i = 0; i < data2.length; i++) {
            let etyentry = data2[i];
            let newdiv = document.createElement('div');
            newdiv.classList.add('ety');
            if (data2.length > 1) {
                displayElement(newdiv, 'h3', `Etymology ${i + 1}:`); // 1-index
            }
            displayInfo(newdiv, `https://en.wiktionary.org/wiki/${etyentry.qy}`);
            displayBreak(newdiv);
            if (etyentry.ety) {
                Sidebar.transferToSidebar(etyentry.ety, newdiv);
            }
            else {
                friendlyError(newdiv, `No etymology found. (Perhaps it\'s lemmatized?)`, true, true, true, true);
            }
            for (let defn of etyentry.defns)
                Sidebar.transferToSidebar(defn.defn, newdiv);
            // onCheckbox();
            $('#sidebar')[0].appendChild(newdiv); // this must come BEFORE
            orig = createTree(oword, olang); // this has createGraph() logic so we must create node in here too
        }
        // success. save wikitext
        // the node better exist
        if (doc && doc.wikitext())
            orig.data().wikitext = doc.wikitext();
    });
    // Temporarily disable URL request for debugging.
}
function createTree(oword, olang) {
    // homebrew graph creation.
    // relies on second.ts
    // let origin = cy.$('node#origin');
    // target = 
    // assumes oword, olang are already parsed once.
    // returns the origin.
    var _a, _b;
    if (!oword)
        oword = _parse($('#qword').val());
    if (!olang)
        olang = _parse($('#qlang').val());
    wls.addwl(oword, olang);
    let origarr = cy().$(`node[id="${oword}, ${olang}"]`);
    let fromScratch = cy().$('node').length === 0;
    if (!(origarr && origarr.length)) {
        let target = cy().add({
            group: 'nodes',
            data: {
                id: `${oword}, ${olang}`,
            }
        })[0];
    }
    origarr = cy().$(`node[id="${oword}, ${olang}"]`);
    assert((_a = cy().$(`node[id="${oword}, ${olang}"]`)) === null || _a === void 0 ? void 0 : _a.length, "couldn't find node");
    if (origarr && origarr.length) {
        let orig = origarr[0];
        orig.data().searched = true;
        orig.style('background-color', 'green');
    }
    let i = 1;
    // let headers = $('#sidebar h3');
    let divlets = $('#sidebar div.ety');
    for (let etydiv of divlets) { // code for multi etymologies
        let lastConnector;
        let $etydiv = $(etydiv);
        // for (let temptxt of etydiv.querySelectorAll('span.template.t-active')) {
        // if(temp)
        for (let anything of $etydiv.children('span')) {
            let temptxt;
            if (anything.matches('.template.t-active')) {
                temptxt = anything; // here is a template
            }
            else {
                continue; // here is text
            }
            let txt = temptxt.textContent;
            if (!txt)
                continue;
            let out = Templates.decodeTemplate(txt);
            if (!out)
                continue;
            let temps;
            if (out.length) { // quickie to check if it's a non-zero array
                temps = out;
            }
            else
                temps = [out];
            for (let temp of temps) {
                let word = _parse(temp.word);
                let langcode = _parse(temp.langcode);
                let lang = _parse(temp.lang);
                if (!lang)
                    lang = langcode;
                if (!word)
                    continue;
                // put the anti-macron on the querying side.
                let targetarr = cy().$(`node[id="${word}, ${lang}"]`);
                let target;
                if (targetarr && targetarr.length) {
                    target = targetarr[0];
                    target.data().langcode = langcode;
                    target.data().isRecon = temp.isRecon;
                }
                else {
                    target = cy().add({
                        group: 'nodes',
                        data: {
                            id: `${word}, ${lang}`,
                            langcode: langcode,
                            isRecon: temp.isRecon
                            // data: { weight: 75 },
                            // position: { x: 200, y: 200 }
                        },
                    });
                }
                // we have the other word. Now we want to look for the node to conenct that word to
                // usually it's the origin, but for chains of inheritance we want to do inheritance.
                let prev = temptxt.previousSibling;
                let connector;
                if (lastConnector && prev && prev.textContent && !prev.textContent.includes('.')) {
                    // if(prev.nodeName === 'H3') {
                    // connector = `${oword}, ${olang}`; // reset origin when crossing etymologies.
                    // Edit: TODO doesn't work
                    // }
                    if (prev.textContent.toLowerCase().includes('from') // from
                        || prev.textContent === ', ') {
                        // || prev.textContent.length >= 2 && /^[^A-Za-z]*$/.test(prev.textContent)) {// is totally nonalphabetical, ie. if it's something like `, `
                        if (prev.previousSibling && ((_b = prev.previousSibling.textContent) === null || _b === void 0 ? void 0 : _b.startsWith('{{root'))) {
                            // make an exception for the first thing being a root or ine-root
                        }
                        else if (temps.length >= 2) { // make an exception for if we're an affixal type. 
                        }
                        else {
                            connector = lastConnector;
                        }
                    }
                }
                if (!connector) {
                    connector = `${oword}, ${olang}`;
                }
                let me = `${word}, ${lang}`;
                lastConnector = me;
                // console.log(`edge ${me};  ${connector}`)
                let id = `${_parse(temp.ttype)} || ${connector}; ${me}`;
                //  || ${oword}, ${olang}
                if (cy().$(`edge[id="${id}"]`).length) {
                    // console.log(`Duplicate edge: ${id}`);
                }
                else if (temp.ttype == 'cog') {
                    // make an exception for cognates. dont' add edges
                }
                else {
                    try {
                        let classes = cognatus.showEdgeLabels ? 'showLabel' : '';
                        cy().add({
                            group: 'edges',
                            data: {
                                id: id,
                                // displaylabel: (document.getElementById('edges-toggle') as HTMLInputElement).checked,
                                label: `${_parse(temp.ttype)}`,
                                template: `${temp.orig_template}`,
                                source: me,
                                target: connector,
                            },
                            classes: classes
                        });
                    }
                    catch (e) {
                        if (e.message.startsWith(`Can not create second element with ID \`${id}`)) {
                            // console.log(`Duplicate edge: ${id}`);
                        }
                        else {
                            // soft fails. Usually because there is a duplicate edge.
                            throw e;
                        }
                    }
                }
            }
        }
    }
    relayout(undefined, fromScratch);
    let ret = cy().$(`node[id="${oword}, ${olang}"]`);
    assert(ret === null || ret === void 0 ? void 0 : ret.length, "couldn't find node");
    return ret[0];
}
