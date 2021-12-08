

let show=document.getElementById('show-password');
let pass=document.querySelector('.pass');
console.log(pass)


show.addEventListener("change",(e)=>{
    if(show.checked==true){
        console.log("event")
       pass.setAttribute("type","text")
    }
    else{
        pass.setAttribute("type","password")
        
    }
   
    
})