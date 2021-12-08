


    


let cartbtn=document.querySelectorAll('.addtocart');
let msg=document.getElementById('msg');
let msgcontain=document.getElementById('msgcontain')
let msgs=document.getElementById('msgs')


setTimeout(()=>{
        if(msgs){
            msgs.remove()
        }
   
  },2000);

function updatecart(pizza){

    console.log(pizza);
    axios.post('/updatecart',pizza)
    .then(res=>{
       
    })
    }


cartbtn.forEach((btn)=>{
    btn.addEventListener("click",(e)=>{
        let currentUser=btn.dataset.user;

        if(currentUser!=""){
            console.log(currentUser)
            
        let pizza=JSON.parse(btn.dataset.pizza);
       

        updatecart(pizza)
 alert('Item added to cart')
           
        }
      else{
       
        alert('Please login to add item to cart')
      }

    })

   
    
})



