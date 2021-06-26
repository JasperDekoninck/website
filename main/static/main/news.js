var news_articles = document.getElementsByClassName("news-article")
var max_height = 250
for(var i = 0; i < news_articles.length; i++) {
    var height = news_articles[i].offsetHeight
    max_height = Math.max(max_height, height)
}
console.log(max_height)

for(var i = 0; i < news_articles.length; i++) {
    var img = news_articles[i].getElementsByTagName("img")[0]
    img.style.height = max_height.toString() + "px"
    img.style.width = max_height.toString() + "px"
    
    var balk = news_articles[i].getElementsByClassName("green-balk")[0]
    balk.style.height = max_height.toString() + "px"
}