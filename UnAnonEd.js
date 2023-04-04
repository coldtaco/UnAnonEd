// ==UserScript==
// @name         UnAnonEd
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Gerry How
// @match        https://edstem.org/au/courses/*/discussion/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=edstem.org
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var xtoken = '';
    var options = {
        headers: {
            'X-Token': xtoken,
        },
    }

    async function requestJSON(url){
        /*
        Resolves JSON request
        */
        const req = await fetch(url, options);
        return req.json();
    };

    async function getAuthorDetails(author, course_id){
        var url = `https://edstem.org/api/courses/${course_id}/users/${author}?emails=true`
        return requestJSON(url).then((res) => {
            return res.user.name;
        })

    };
    async function getPostAuthor(post){
        var url = `https://edstem.org/api/threads/${post}`
        return requestJSON(url).then((res) => {
            return {'user_id': res.thread.user_id,
                    'course_id': res.thread.course_id};
        })
    };

    async function fixAnon(ele){
        /*
        Grabs thread id to figure out author id, uses author id to grab name, then inserts name in left sidebar
        */
        var href = ele.getElementsByTagName('a')[0].href;
        var name_element = ele.getElementsByClassName('dft-user')[0];

        if (name_element.innerHTML.localeCompare('Anonymous') != 0) {return;}

        var post_id = href.split('/').pop();
        var res = await getPostAuthor(post_id)
        var user_id = res.user_id;
        var course_id = res.course_id
        var author_name = await getAuthorDetails(user_id, course_id)

        name_element.innerHTML = `${author_name} (Anonymous)`;
    };

    async function fixWrapper(event){
        /*
        Wrapper to get element from event and pass it to fixAnon
        */
        var ele = event.target;
        if (ele.nodeName.localeCompare('#text') == 0){return;}
        if (ele.className.localeCompare('dlv-item') != 0){return;}
        await fixAnon(ele);
    };


    function waitForElm(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    resolve(document.querySelector(selector));
                    observer.disconnect();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    function fixExisting(elements){
        /*
        Iterate through list of elements already loaded
        */
        for (let i = 0; i < elements.length; i++){
            fixAnon(elements[i]);
        }
    };

    // Wait for element
    waitForElm('.dtl-group-heading').then((elm) => {
        console.log('Element is ready');
        console.log(elm.textContent);
        // Grab left sidebar, fix existing and add eventlistener
        const discussion_list = document.getElementsByClassName('discuss-thread-list')[0];
        discussion_list.addEventListener("DOMNodeInserted", fixWrapper);
        fixExisting(discussion_list.getElementsByClassName('dlv-item'));
    });
})();