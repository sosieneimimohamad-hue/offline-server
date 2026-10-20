const express = require('express');
const app = express();
const path = require('path');
app.use(express.json());

let DB = { 
  devices: {}, 
  config: { minVersion: 1, latestUrl: "", killAll: false } 
};

app.post('/register', (req,res)=>{
  const {deviceId, androidId} = req.body;
  if(!DB.devices[deviceId]) {
    DB.devices[deviceId] = {status:"pending", lastSeen:new Date(), blocked:false, androidId};
  }
  res.json({ok:true});
});

app.get('/is-activated', (req,res)=>{
  const d = DB.devices[req.query.deviceId];
  if(!d) return res.json({activated:false});
  if(d.blocked) return res.json({activated:false, blocked:true});
  if(d.status==="active") return res.json({activated:true});
  res.json({activated:false});
});

app.post('/heartbeat', (req,res)=>{
  const {deviceId, androidId, version} = req.body;
  const d = DB.devices[deviceId];
  if(!d) return res.json({action:"BLOCK"});
  if(d.blocked) return res.json({action:"BLOCK"});
  if(d.androidId && d.androidId !== androidId) return res.json({action:"BLOCK"});
  if(DB.config.killAll) return res.json({action:"BLOCK"});
  d.lastSeen = new Date();
  res.json({action:"OK"});
});

app.post('/admin', (req,res)=>{
  if(req.body.secret !== "OFFLINE2026") return res.json({error:"secret"});
  const {action, deviceId} = req.body;
  if(action==="activate" && DB.devices[deviceId]) DB.devices[deviceId].status="active";
  if(action==="block" && DB.devices[deviceId]) DB.devices[deviceId].blocked=true;
  if(action==="unblock" && DB.devices[deviceId]) DB.devices[deviceId].blocked=false;
  if(action==="unkill") DB.config.killAll=false;
  if(action==="kill_all") DB.config.killAll=true;
  res.json({success:true});
});

app.get('/dashboard-data', (req,res)=> res.json(DB));
app.get('/', (req,res)=> res.sendFile(path.join(__dirname,'dashboard.html')));
app.listen(process.env.PORT || 3000, ()=>console.log("OFFLINE SERVER ON"));