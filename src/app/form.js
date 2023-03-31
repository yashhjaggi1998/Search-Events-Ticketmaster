var locationCity = "";

fetch('https://ipinfo.io/json?token=33135b61180fbe')
	.then(RES => RES.json())
	.then(data => 
{locationCity = data.city; console.log('City: ', locationCity); });


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


function jsCheckAutoDetect()
{
	var autoDetectCheckBox = document.getElementById("autoDetectLocation");	
	var locationObj = document.getElementById("location");		

	if(autoDetectCheckBox.checked)
	{
		locationObj.value = "";
		//locationObj.disabled = true;
		locationObj.required = false;
	}
	else
	{
		locationObj.value = "";
		//locationObj.disabled = false;
		locationObj.required = true;
	}
}
