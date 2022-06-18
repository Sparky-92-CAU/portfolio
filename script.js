const welcomeMsg = document.querySelector(".welcome-msg");
const welcome = document.querySelector("#welcome");
const msg = document.querySelector("#msg")
var english = true;

const body = document.querySelector("body");
const picContainer = document.querySelector(".olive-and-me");
const links = document.querySelector("li");





/*Event listener that translates text from english to spanish and vis a vis on click*/ 
welcomeMsg.addEventListener("click",function(e){

    if (english){
        welcome.textContent="¡Bienvenidos!"
        msg.textContent="Me llamo Clark Urbon y este es el sitio web de mi portfolio. El propósito de este sitio es mostrar mis habilidades con la esperanza de conseguir un puesto como desarrollador de pagina web. ¡Espero que disfrutes!"
        english= false;
    }
    else{
        welcome.textContent="Welcome!";
        msg.textContent="My name is Clark Urbon and this is my portfolio website.The purpose of this site is to showcase my abilities in hopes of landing a junior developer position. Enjoy!";
        english =true;
    };

   

});

picContainer.addEventListener("click", function(e){
    body.style.backgroundColor = getRandomColor();
    body.style.color= getRandomColor();
    links.style.color=getRandomColor();
    console.log(getRandomColor());

});


function getRandomColor() {
    var randomColor = Math.floor(Math.random()*16777215).toString(16);
    return "#"+randomColor;
  }