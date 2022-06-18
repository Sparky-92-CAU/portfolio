const welcomeMsg = document.querySelector(".welcome-msg");
const welcome = document.querySelector("#welcome");
const msg = document.querySelector("#msg")
var english = true;
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