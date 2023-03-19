var locationCity = "";

fetch('https://ipinfo.io/json?token=33135b61180fbe')
	.then(RES => RES.json())
	.then(data => 
{locationCity = data.city; console.log('City: ', locationCity); });



  window.fbAsyncInit = function() {
    FB.init({
      appId      : '745115177154709',
      cookie     : true,
      xfbml      : true,
      version    : 'v2.2'
    });
      
    FB.AppEvents.logPageView();   
      
  };

  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "https://connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));

function formInit()
{
	document.getElementById("distance").value = 10;
}
function submitForm(location)
{
	if(location == '')
		return locationCity;
	else 
	return location;  
}
function shareFBPost()
{
	console.log("FB");
	FB.ui( {
			display: 'popup',
			method: 'share',
			href: 'https://www.ticketmaster.com/pnk-summer-carnival-2023-inglewood-california-10-05-2023/event/0A005D68C2D2346F',
		}, function(response){});
}

/*function checkAutoDetect()
{
	var autoDetectCheckBox = document.getElementById("autoDetectLocation");	
	var locationObj = document.getElementById("location");		

	if(autoDetectCheckBox.checked)
	{
		locationObj.value = "";
		locationObj.disabled = true;
		locationObj.required = false;
	}
	else
	{
		locationObj.value = "";
		locationObj.disabled = false;
		locationObj.required = true;
	}
}*/