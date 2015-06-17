var lis = document.querySelectorAll("li");
lis[0].addEventListener("click",function(){
    lis[1].classList.remove("current");
    this.classList.toggle("current");
    document.getElementsByTagName("h1")[0].innerHTML = "admin";
    document.querySelectorAll("input[value=admin]")[0].checked = true;
    document.querySelectorAll("input[value=user]")[0].checked = false;
});
lis[1].addEventListener("click", function(){
    lis[0].classList.remove("current");
    this.classList.toggle("current");
    document.getElementsByTagName("h1")[0].innerHTML = "user";
    document.querySelectorAll("input[value=admin]")[0].checked = false;
    document.querySelectorAll("input[value=user]")[0].checked = true;
});