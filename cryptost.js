//sum js stuff

//get all "js-tweet-text-containter"s <p>s contain text
// var posts = document.getElementsByClassName("js-tweet-text-containter");

// for(var i=0; i < posts.length; i++){
//     console.log(posts[i]);//.find(".js-tweet-text"));
// }

// var decryptButton = function(){
//     var decryptDiv = document.createElement('div');
//     decryptDiv.className = "ProfileTweet-action";
    
// }
document.onreadystatechange = function () {
    console.error(document.readyState);
};

const decryptBtnEnable = "decrypt-button-enabled";
const encryptEnabled = "encrypt-button-enabled";
const tweet_btn = document.querySelector('#global-new-tweet-button');


var decryptText = (btn)=>{
//    alert("Button clicked " + btn.id);
    //get text by btn
    var tweet = document.querySelector('#tweet-'+btn.id);
    var text = tweet.querySelector('.js-tweet-text');
    console.error(text);
    text.innerHTML = "DECRYPTED";
};

var addDecryptButton = ()=>{
    var tweets = document.getElementsByClassName("tweet");

    for(var i=0; i < tweets.length; i++){
        //var texts = tweets[i].getElementsByClassName("js-tweet-text");
        var buttons = tweets[i].querySelector(".ProfileTweet-actionList");
        if(buttons && !buttons.classList.contains(decryptBtnEnable)){
            var d_btn = buttons.children[0].cloneNode(true);
            var btn = d_btn.children[0];
            btn.classList.remove("js-actionReply");
            btn.removeAttribute("data-modal");
            btn.removeAttribute("aria-describedby");
            btn.id = "de"+i;
            tweets[i].id = "tweet-"+btn.id;
            btn.title = "decrypt";
            btn.onclick = function(){decryptText(this);};
            btn.children[1].remove();
            var icon = btn.querySelector(".Icon");
            icon.classList.remove("Icon--reply");
            icon.classList.add("Icon--protected");
            buttons.appendChild(d_btn);
            buttons.classList.add(decryptBtnEnable);
        }
    }
};

var encryptText = (btn)=>{
    var tweet_box = document.querySelector(".is-tweet-box-focus");
    console.error(tweet_box);
    var text = tweet_box.querySelector('.tweet-box');
    text.innerText = "Encrypted text ...";
};

var addEncryptButton =()=>{
    var tweet_box = document.querySelector(".is-tweet-box-focus")
    //var button_box = document.querySelector('#Tweetstorm-tweet-box-0 > div:nth-child(2) > div:nth-child(2)');
    var btn_bx = tweet_box.querySelector('.TweetBoxExtras');
    if(btn_bx.classList.contains(encryptEnabled)){
        return;
    }
    var decrypt_btn = btn_bx.children[0].cloneNode(true);
    var rubbish = decrypt_btn.querySelector('.image-selector');
    rubbish.remove();
    var btn = decrypt_btn.querySelector('.btn');
    btn.onclick = ()=>{encryptText(this);};
    btn.title = "Encrypt message";
    btn.id = "encrypt";
    var icon = btn.querySelector('.Icon');
    icon.classList.remove('Icon--media');
    icon.classList.add('Icon--protected');
    console.error(decrypt_btn);
    btn_bx.classList.add(encryptEnabled);
    tweet_box.id = "tweet-"+btn.id;
    btn_bx.appendChild(decrypt_btn);
};

//TODO scrolling elements

var eventListener = (event) =>{
    setTimeout(function(){addDecryptButton();}, 800);
};

var runAll = (event)=>{
    console.error("CLICK!!!!");
    setTimeout(function(){addEncryptButton();}, 750);
};

addDecryptButton();

document.body.addEventListener('click', (e)=>{
    console.error(e.target);
    if(e.target == tweet_btn){
        console.error(e);
        runAll();
    }else if(e.target.classList.contains("tweet")){
        eventListener();
    }
});
// var es = document.querySelectorAll('.tweet');
// es.forEach((e) =>{
//     e.addEventListener('click', eventListener);
// });



// BUTTON class: TweetBoxToolbar then TweetBoxExtras
//<span class="TweetBoxExtras-item"><div class="photo-selector" !diff??> <button class="btn icon-btn js-tooltip"
//   type="button" data-original-title="Encrypt tweet"
//  on button level span class="text add-photo-label u-hiddenVisually" 
// TEXT class: tweet-box
// TWEETER: username
// logged in user: .name     // only on home DashboardProfileCard -> username

console.log("DONE");

window.twttr = (function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0],
        t = window.twttr || {};
    if (d.getElementById(id)) return t;
    js = d.createElement(s);
    js.id = id;
    js.src = "https://platform.twitter.com/widgets.js";
    fjs.parentNode.insertBefore(js, fjs);

    t._e = [];
    t.ready = function(f) {
        t._e.push(f);
    };

    return t;
}(document, "script", "twitter-wjs"));









