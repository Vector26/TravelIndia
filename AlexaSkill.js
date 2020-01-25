exports.handler = function(event, context) {
    //try sec
    try {
        if(!event.session.attributes){
            event.session.attributes={};
            var attr=event.session.attributes;
        }else
            var attr=event.session.attributes;
        var request = event.request;
        var session = event.session;

        if (!session.attributes)
        session.attributes = {};
        if (request.type === "LaunchRequest") {
            let options = {
                speechText: "Hello this is Travel India. What would you like to do?",
                reprompt: "You can Search for a place or Get directions or also Use our SOS service",
                endSession: false
            };
            context.succeed(buildResponse(options));
        }
        else if(request.type==="IntentRequest"){
            console.log("IntentRequest");
            if(request.intent.name==="holidayPlanner")
              holidayPlanner(attr,context);
            if(request.intent.name==="Direction")
                DirectionSpeech(event.context,session.attributes,context,request);
            if(request.intent.name==="moreDirection")
                moreDirection(session.attributes,context,request);
            if(request.intent.name==="placeFinder")
                placeFinder(session.attributes,context,request);
                //context.succeed(buildResponse({speechText:"3",endSession:true}));
            if(request.intent.name==="visaInfo")
                visainfo(session.attributes,context,request);
            if(request.intent.name==="hotelSearch")
                {  let arr=hotelSearch(event.context,session.attributes,context,request);
                    if((arr[0]).length>0)
                    context.succeed(buildResponse({speechText:arr[0][0],sessionAtt:{local:{steps:1,arr:arr}},card: {
      type: "Simple",
      title: session.user.userId,//arr[0][0],
      content: arr[1][0]
    },endSession:false}));
                    else
                    context.succeed(buildResponse({speechText:`No ${request.intent.slots.types.value} found`,endSession:false}));
                }
                if(request.intent.name==="weatherKnowledge")
                weatherKnowledge(attr,context,request);
                if(request.intent.name==="seasonRecommend")
                seasonRecommend(attr,context,request);
                if(request.intent.name==="AMAZON.CancelIntent"||request.intent.name==="AMAZON.StopIntent")
                context.succeed(buildResponse({speechText:"Ok, cancelling",endSession:true}));
                if(request.intent.name==="AMAZON.HelpIntent")
                context.succeed(buildResponse({speechText:"Welcome to the help section of the Travel india. it provides services like directions from your location to another place. to use direction intent say direct me to , place you want to go . it can also provide details  about the place , just name it. it can also provide you details about prerequisites for coming to india if you are a foreign user. and it can also recommend you cities or states to visit in different seasons.",endSession:false}));
                if(request.intent.name==="sos")
                sos(attr,context,request);
            
        }
        
    }
    //try section end
    //catch Section
    catch (e) {
        console.log(e);
    }
    //catch section End
};

const http=require('http');
function holidayPlanner(attr,context){
    let data;let body;let collection="";
    http.get("http://datapointer.000webhostapp.com/seasons.json#",(res)=>{
       res.on('data',(info)=>{
              body+=info;
              }); 
        res.on('end',()=>{
           body=body.replace(/undefined/,'');
             data=JSON.parse(body);
            (data.north).forEach(ele=>{
                collection+=" "+ele+" <break time='1s'/>";
            });
             context.succeed(buildResponse({speechText:collection,endSession:true}));
        });
    });
    
}



const https=require('https');
function DirectionSpeech(cont,attr,context,request){
    let placeName=request.intent.slots.places.value;
    
    
    
    var i=0;
    if(attr.step!=null)
    i=attr.step;
    var start=[];
    var Data=[];let body;let collection="";
    var geoObject = cont.Geolocation;
    //context.succeed(buildResponse({speechText:"Location Services are not available,please enable them if this device supports it",endSession:false}));
   /* context.succeed(geoObject);*/
                if (geoObject) { 
                           let coord= geoObject.coordinate;
                        start=[coord.latitudeInDegrees,coord.longitudeInDegrees];
                }
        else{
            start=[31.0159586,77.0717363];
            /*let options={speechText:"Location Services are not available,please enable them if this device supports it",card:{type: "AskForPermissionsConsent",permissions: ["alexa::devices:all:geolocation:read"]},endSession:false};
         context.succeed(buildResponse(options));*/   
        }
        
    let coordinates;
    if(attr.local){
        coordinates=attr.local.value;
    }
    
    else{
    coordinates=PlaceDetect(placeName)['result']['geometry']['location'];}
    /*context.succeed(buildResponse({speechText:start[0]+" and "+start[1],card: {
      type: "Simple",
      title: "This is the Title of the Card",
      content: start[0]+" and "+start[1]
    },endSession:false}));*/
    //start=[26.790085, 80.911433];
    https.get(`https://maps.googleapis.com/maps/api/directions/json?origin=${start[0]},%20${start[1]}&destination=${coordinates['lat']},${coordinates['lng']}&key=AIzaSyDvS_ZbCO7TsQmEBY0Ne0oR85SThn6BQRQ`,(res)=>{
       res.on('data',(info)=>{
              body+=info;
              }); 
        res.on('end',()=>{
          body=body.replace(/undefined/,'');
          body=body.replace(/&nbsp;/,'');
          //context.succeed(buildResponse({speechText:body,endSession:false}));
          var data=JSON.parse(body);
    var routes=data['routes'];
    routes.forEach((route)=>{
     route['legs'].forEach((leg)=>{
         leg['steps'].forEach((step)=>{
             var msg=step['html_instructions'].replace(/<[^>]*>/g,' ');
             msg=msg+` | Time needed:${step['duration']['text']}`+` |  Distance to cover:${step['distance']['text']}`;
            Data.push(msg);
         });
     });   
    });
    if(Data.length>0)
    context.succeed(buildResponse({speechText:"Here are the steps..."+Data[0],endSession:false,card: {
      type: "Simple",
      title:`Step: 1`,
      content: Data[i]
    },sessionAtt:{directions:{steps:1,arr:Data},placename:placeName}}));    
    else
    context.succeed(buildResponse({speechText:"No place Found",endSession:true}));
        /*++i;
            if((i-1)<Data.length){
                context.succeed(buildResponse({speechText:Data[i-1],endSession:false,sessionAtt:i}));}
             else if((i-1)>=(Data.length-1)){
                 context.succeed(buildResponse({speechText:"You have reached your destination",endSession:false,sessionAtt:"Finished"}));}
            else{
                 context.succeed(buildResponse({speechText:"You have reached your destination",endSession:false,sessionAtt:"Finished"}));}*/
        });
    });
}




const requestt = require('request');
const syncReq=require('sync-request');
function PlaceDetect(placeName){
//var Data;
//context.succeed(buildResponse({speechText:placeName,endSession:false}));
placeName=placeName.replace(/ /,'%20');
let Data=syncReq('GET',`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${placeName}&inputtype=textquery&key=AIzaSyDvS_ZbCO7TsQmEBY0Ne0oR85SThn6BQRQ`);
     //context.succeed(buildResponse({speechText:body,endSession:false}));
    
    let body=Data.getBody('utf8');
    let data;
    //context.succeed(buildResponse({speechText:body,endSession:false}));
    data=JSON.parse(body);

    var place_id;
     place_id=data['candidates'][0]['place_id'];
    //context.succeed(buildResponse({speechText:place_id,endSession:false}));
let fData=syncReq('GET',`https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=AIzaSyDvS_ZbCO7TsQmEBY0Ne0oR85SThn6BQRQ`);
    body=fData.getBody('utf8');
    
    data=JSON.parse(body);
    //context.succeed(buildResponse({speechText:data,endSession:false}));
    return data;
    //let service=request.intent.slots.service.value;
    /*if(!service){var coordinates=data['result']['geometry']['location'];
    DirectionSpeech(attr,context,request,coordinates);}*/
    
}
function weatherKnowledge(attr,context,request){
    let body;
    
    if(request.intent.slots.place.value){
    let data=PlaceDetect(request.intent.slots.place.value);
    //context.succeed(data['result']['geometry']['location']['lat']+" "+data['result']['geometry']['location']['lng']);
    body=syncReq('GET',`http://api.openweathermap.org/data/2.5/weather?lat=${data['result']['geometry']['location']['lat'].toFixed(4)}&lon=${data['result']['geometry']['location']['lng'].toFixed(4)}&units=metric&apikey=0e463c5306ad1522120979347e9fd64a`).getBody('utf8');
    //context.succeed(body);
    var name=data['result']['name'];
    }
    else
    {
    body=syncReq('GET',`http://api.openweathermap.org/data/2.5/weather?lat=31.016173&lon=77.071902&units=metric&apikey=0e463c5306ad1522120979347e9fd64a`).getBody('utf8');
    }
    body=JSON.parse(body);
    let options={speechText:`Weather is ${body['weather'][0]['main']}. Temperature feels like : ${body['main']['feels_like']} degree Centigrade .`,
        card: {
      type: "Simple",
      title: "Waknaghat,Jaypee University.",
      content: `Weather is ${body['weather'][0]['main']}. Temperature feels like : ${body['main']['feels_like']}Cº`},
      endSession:false};
      if(name)
      options.card.title=name;
      if(body['weather'][0]['main']==="Clear sky"||body['weather'][0]['main']==="Clear")
      {options.card.content=options.card.content+"I would receommend going out. This is a nice weather.";
          options.speechText=options.speechText+"I would receommend going out. This is a nice weather.";
      }
      context.succeed(buildResponse(options));
    }

function hotelSearch(cont,attr,context,request){
    let service=request.intent.slots.type.value;
    var geoObject = cont.Geolocation;
    let start=[];
    let arr=[];
    let arr2=[];
    //context.succeed(buildResponse({speechText:"Location Services are not available,please enable them if this device supports it",endSession:false}));
    
   /* context.succeed(geoObject);*/
                if (geoObject){ 
                           let coord= geoObject.coordinate;
                        start=[coord.latitudeInDegrees,coord.longitudeInDegrees];
                        //context.succeed(buildResponse({speechText:start[0]+", "+start[1],endSession:false}));
                }
        else{
            //let options={speechText:"Location Services are not available,please enable them if this device supports it",card:{type: "AskForPermissionsConsent",permissions: ["alexa::devices:all:geolocation:read"]},endSession:false};
         //context.succeed(buildResponse(options));
         start=[31.016173,77.071902];
        }
    let body=syncReq('GET',`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${start[0]},${start[1]}&radius=2000&name=${service}&key=AIzaSyDvS_ZbCO7TsQmEBY0Ne0oR85SThn6BQRQ`);
    body=body.getBody('utf8');
    body=JSON.parse(body);
    body['results'].forEach((obj)=>{
        arr.push(`${obj['name']}`);
        arr2.push(obj['vicinity']);
    });
    let cou=0;
    if(arr.length<5){
    body=syncReq('GET',`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${start[0]},${start[1]}&radius=7500&name=${service}&key=AIzaSyDvS_ZbCO7TsQmEBY0Ne0oR85SThn6BQRQ`);
    body=body.getBody('utf8');
    body=JSON.parse(body);
    body['results'].forEach((obj)=>{
        if(arr[cou]!==obj['name']){
        arr.push(`${obj['name']}`);
        arr2.push(obj['vicinity']);}
    cou++;
        
    });}
    let c=0;
    while(c<1&&body['next_page_token']){
       body=(syncReq('GET',`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${start[0]},${start[1]}&next_page_token=${body['next_page_token']}&radius=1500&name=${service}&key=AIzaSyDvS_ZbCO7TsQmEBY0Ne0oR85SThn6BQRQ`)).getBody('utf8'); 
       body=JSON.parse(body);
       body['results'].forEach((obj)=>{
        if(obj['name']!=="Jaypee University of Information Technology"&&obj['name']!=="Waknaghat"&&obj['name']!=="JUIT Auditorium"&&obj['name']!=="Laundry"&&obj['name']!=="BasketBall Court"&&obj['name']!=="Azad Bhawan"&&obj['name']!=="Azad Bhavan"){
        arr.push(`${obj['name']}`);
        arr2.push(obj['vicinity']);}
    });c++;
    }
    return ([arr,arr2]);
    //context.succeed(buildResponse({speechText:msg,endSession:false}));
}


function visainfo(attr,context,request){
let body=syncReq('GET',"http://datapointer.000webhostapp.com/VisaInfo.json");
body=body.getBody('utf8');
body=JSON.parse(body);
let count=request.intent.slots.country.value;
context.succeed(buildResponse({speechText:"Here are the details. . ."+body['countries'][`${count}`],card: {
      type: "Simple",
      title: count,
      content: "Here are the details. . ."+body['countries'][`${count}`]
    },endSession:false}));
}

function seasonRecommend(attr,context,request){
    let body=syncReq('GET',"http://datapointer.000webhostapp.com/seasons.json#").getBody('utf8');
    body=JSON.parse(body);
    //context.succeed(body['month'][`${request.intent.slots.season.value}`]);
    let msg="";
    let options;
    if(request.intent.slots.season.value){
        (body['month'][`${request.intent.slots.season.value}`]).forEach((name)=>{
            msg=msg+name+",";
        });
        msg=msg.replace(/&/,' and ');
        context.succeed(buildResponse({speechText:"Places are ."+msg,endSession:false}));
    }
    else if(request.intent.slots.state.value){
      options={speechText:body['state'][`${request.intent.slots.state.value}`]['value'],
        card:{
      type: "Simple",
      title: request.intent.slots.state.value,
      content: body['state'][`${request.intent.slots.state.value}`]['value']},
      endSession:false};
      context.succeed(buildResponse(options));
        
    }
      
}

function sos(attr,context,request){
    let options={speechText:"This is the SOS intent. Here some of the things you can do Dial 112 from your phone. Press power button on your smart phone 3 times quickly to activate Panic call. In case of feature phone, long press ‘5’ or ‘9’ key to activate Panic call. Log on to State ERSS website and place your SOS request. Email SOS alert to State ERC. Use 112 India Mobile App (available in Google Playstore and Apple store) to activate a panic call to ERC.",
        card:{
      type: "Simple",
      title: "SOS",
      content: "This is the SOS intent. Here some of the things you can do Dial 112 from your phone. Press power button on your smart phone 3 times quickly to activate Panic call. In case of feature phone, long press ‘5’ or ‘9’ key to activate Panic call. Log on to State ERSS website and place your SOS request. Email SOS alert to State ERC. Use 112 India Mobile App (available in Google Playstore and Apple store) to activate a panic call to ERC."},
      endSession:false};
      
      if(request.intent.slots.medical.value){
          options.speechText=options.speechText+" Here are some of the Medical store . Jai Jwala medical store .";
      }
      context.succeed(buildResponse(options));
}

function moreDirection(attr,context,request){
    let i;
    if(request.intent.slots.forward.value)
    {if(attr.directions)
    {i=attr.directions.steps;
    let Data=attr.directions.arr;
            ++i;
            if((i-1)<Data.length){
                context.succeed(buildResponse({speechText:Data[i-1],endSession:false,card: {
      type: "Simple",
      title:`Step: ${i+1}`,
      content: Data[i]
    },sessionAtt:{directions:{steps:i,arr:Data}}}));}
            else{
                 context.succeed(buildResponse({speechText:"You have reached your destination",endSession:false,sessionAtt:{directions:{steps:i,arr:[]}}}));}
    }
     if(attr.local)
    {i=attr.local.steps;
    let Data=attr.local.arr;
    
            ++i;
            if((i-1)<Data[0].length){
                context.succeed(buildResponse({speechText:Data[0][i-1],endSession:false,card: {
      type: "Simple",
      title: Data[0][i],
      content: Data[1][i]
    },sessionAtt:{local:{steps:i,arr:Data}}}));}
            else{
                 context.succeed(buildResponse({speechText:"thats all folks",card: {
      type: "Simple",
      title: "Thats All Folks",
      content: "End of The List"
    },endSession:false,sessionAtt:{local:{steps:i,arr:[]}}
                     
                 }));}
    }   
    }
    //context.succeed(buildResponse({speechText:request.intent.slots.Fservice.value,endSession:true}));
     if(request.intent.slots.Fservice.value){
        
        if(attr.photos.steps){
        i=attr.photos.steps;
    //context.succeed(buildResponse({speechText:"hello",endSession:true}));
    let Data=attr.photos.list;
    let largeImg=(Data[i].url).replace(/maxwidth=400/g,'maxwidth=800');
    let options;
            ++i;
            if((i-1)<Data.length){
                options={speechText:"Here it is",endSession:false,card:{
    type:"Standard",
   title:attr.photos.placename ,
   text: `Uploader:${Data[i-1].name}`,
   image:{
       smallImageUrl: Data[i-1].url,
       largeImageUrl: largeImg
   }
   }
                ,sessionAtt:{photos:{steps:i,list:Data}}};
            
                context.succeed(buildResponse(options));
            }
            else{
                 context.succeed(buildResponse({speechText:"You have viewed all the photos",endSession:false,sessionAtt:{}}));
                
            }
    }
    }
    
}

/*function DirectionSpeech(attr,context,request){

var s=[26.790085, 80.911433];
var e=[26.793435, 80.882619];
var g=h.rasta(s,e);
context.succeed(buildResponse({speechText:g[0],endSession:true}));


}*/

function placeFinder(attr,context,request){
    
    let placeName=request.intent.slots.place.value;
    //context.succeed(buildResponse({speechText:placeName,endSession:true}));
    let service=request.intent.slots.service.value;
    //context.succeed(buildResponse({speechText:service,endSession:true}));
    let arr=[];
    if(service==='photos'||service==='photo'||service==='pictures'||service==='picture')
    {
    let Data=PlaceDetect(placeName);
    Data['result']['photos'].forEach((obj)=>{
        
        let photo_reference=obj['photo_reference'];
    let rawData=syncReq('GET',`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo_reference}&key=AIzaSyBARs4NOfqKP_EMzFCavnHgSgKYkHJ9KAA`);
    //
    let url=rawData.url;
    //context.succeed(buildResponse({speechText:url,endSession:true}));
   let te=obj['html_attributions'][0].replace(/<[^>]*>/g,'');
   arr.push({url:url,name:te});
   
     
    });
    //context.succeed(buildResponse({speechText:arr[0].url,endSession:true}));
    let largeImg=(arr[0].url).replace(/maxwidth=400/g,'maxwidth=800');
    var options={speechText:"See your Alexa App to view the photos",
   card: 
   {type:"Standard",
   title: placeName,
   text: `Uploader:${arr[0].name}`,
   image:{
       smallImageUrl: arr[0].url,
       largeImageUrl: largeImg
   }
   },sessionAtt:{photos:{placename:placeName,steps:1,list:arr}},endSession:false};
       //context.succeed(options); 
     context.succeed(buildResponse(options));
        
    }
    
    //____________________________________________________________________________________________________________________________
    
    
    //context.succeed(Data['result']['reviews']);
    else
    {
    let Data=PlaceDetect(placeName);
    //context.succeed(Data['result']['reviews']);
    Data['result']['reviews'].forEach((obj)=>{
        
        let photo_reference=obj['text'];
    //context.succeed(buildResponse({speechText:url,endSession:true}));
    let url=obj['profile_photo_url']
   let te=obj['author_name'];
   arr.push({url:url,name:{review:photo_reference,pname:te}});
   
     
    });
    //context.succeed(buildResponse({speechText:arr[0].url,endSession:true}));
    var options={speechText:"See your Alexa App to view the photos",
   card: 
   {type:"Standard",
   title: `Uploader:${arr[0].name.pname}`,
   text: `${arr[0].name.review}`,
   image:{
       smallImageUrl: arr[0].url,
       largeImageUrl: arr[0].url
   }
   },sessionAtt:{photos:{placename:placeName,steps:1,list:arr}},endSession:false};
       //context.succeed(options); 
     context.succeed(buildResponse(options));
        
    }
    
}
    //context.succeed(buildResponse({speechText:body,endSession:true}));
    

function buildResponse(options) {
    let data = {
        version: "1.0",
        sessionAttributes:{},
        response: {
            outputSpeech: {
                type: "SSML",
                ssml: `<speak>${options.speechText}</speak>`
            },
            shouldEndSession: options.endSession
        }
    };
    try{if(options.sessionAtt){
    if(options.sessionAtt.directions)
    data.sessionAttributes.directions=options.sessionAtt.directions;
    if(options.sessionAtt.local)
    data.sessionAttributes.local=options.sessionAtt.local;
    if(options.sessionAtt.photos)
    data.sessionAttributes.photos=options.sessionAtt.photos;}
    if(options.card)
    data.response.card=options.card;
    if(options.reprompt){
    data.response.reprompt={
      outputSpeech: {
        type: "SSML",
        ssml: `<speak>${options.reprompt}</speak>`
      }
    }
    }
    }
    finally{
    return data;}
}