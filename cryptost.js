//sum js stuff

//get all "js-tweet-text-containter"s <p>s contain text
// var posts = document.getElementsByClassName("js-tweet-text-containter");

// for(var i=0; i < posts.length; i++){
//     console.log(posts[i]);//.find(".js-tweet-text"));
// }

var elements = document.getElementsByTagName('*');

console.log(elements);

var tweets = document.getElementsByClassName("content");
console.log(tweets);

//use innerText or inner HTML???

for(var i=0; i < tweets.length; i++){
    var texts = tweets[i].getElementsByClassName("js-tweet-text");
    console.log(texts);
    var text = texts[0].innerText;
    console.log(text); //.find(".js-tweet-text"));
    texts[0].innerText = "You can't read this";
}

//TODO scrolling elements
