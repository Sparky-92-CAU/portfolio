//variables/selectors for welcome message
const welcomeMsg = document.querySelector(".welcome-msg");
const welcome = document.querySelector("#welcome");
const msg = document.querySelector("#msg")
var english = true;

// variables/selectors for profile picture
const body = document.querySelector("body");
const picContainer = document.querySelector(".olive-and-me");
const links = document.querySelector("li");

//variables/selectors for contact icons
const mail = document.querySelector(".mail");
const github = document.querySelector(".github");
const linkedin = document.querySelector(".linkedin");
const mobile = document.querySelector(".mobile");








/*Event listener that translates text from english to spanish and vis a vis on click*/ 
welcomeMsg.addEventListener("click",function(e){

    if (english){
        welcome.textContent="¡Bienvenidos!"
        welcome.lang="es";
        msg.lang="es";
        msg.textContent="Soy ingeniero de software en el Servicio de Impuestos Internos de Estados Unidos (IRS). Tengo experiencia modernizando sistemas empresariales en Java, resolviendo problemas complejos en producción y coordinando lanzamientos. También cuento con experiencia en ciberseguridad de tecnología operativa (OT): inventarios de dispositivos, aplicación de STIGs y elaboración de diagramas de red. Mi objetivo es seguir desarrollando software seguro y confiable y mejorar la forma en que los equipos mantienen sistemas complejos."
        english= false;
    }
    else{
        welcome.textContent="Welcome!";
        welcome.lang="en";
        msg.lang="en";
        msg.textContent="I'm a software engineer at the IRS with experience modernizing enterprise Java systems, troubleshooting complex production issues, and coordinating releases. My background also includes operational technology cybersecurity, from asset inventories and STIG hardening to network diagrams. My goal is to keep building secure, reliable software and improve how teams maintain complex systems.";
        english =true;
    };

   

});



/* event listener that changes background color to random color  */
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