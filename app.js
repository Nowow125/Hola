const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storageKey = 'huddle-cozy-corner-v1';
const defaultChannels = [
  {id:'welcome', name:'welcome', description:'Start here and make yourself at home'},
  {id:'general', name:'general', description:'Your space for all things community', unread:3},
  {id:'introductions', name:'introductions', description:'Say hello to your new favorite people'},
  {id:'share-your-work', name:'share-your-work', description:'Show us what you’re creating'},
  {id:'good-vibes', name:'good-vibes', description:'A little sunshine for your day'},
  {id:'recommendations', name:'recommendations', description:'The good stuff, shared'}
];
const people = [
  {name:'Sophie Chen',status:'Making things ✨',img:32,role:'HOST'},
  {name:'Marcus Lee',status:'Probably listening to music',img:12},
  {name:'Olivia Bennett',status:'Out here creating',img:44},
  {name:'Noah Williams',status:'☕ Coffee first',img:68},
  {name:'Maya Patel',status:'Dreaming up ideas',img:45},
  {name:'Ethan Brooks',status:'Here for a good time',img:11},
  {name:'Jules Rivera',status:'✦ Stay curious',img:25},
  {name:'Alex Morgan',status:'Online',img:47},
  {name:'Ava Thompson',status:'Away',img:49,away:true},
  {name:'Leo Park',status:'Away',img:14,away:true},
  {name:'Isabella Rose',status:'Away',img:26,away:true},
  {name:'Finn Cooper',status:'Away',img:59,away:true}
];
const seed = {
 general:[
  {id:'a',name:'Sophie Chen',img:32,role:'HOST',time:'Today at 9:41 AM',text:'Good morning, lovely people! ☀️\nWhat’s one little thing you’re looking forward to this week?',reactions:[['💛',8],['✨',4],['☀️',3]]},
  {id:'b',name:'Marcus Lee',img:12,time:'Today at 9:48 AM',text:'Morning! Finally getting around to that book that’s been sitting on my nightstand for months. The little things, you know? 📖',reactions:[['🙌',4],['💛',2]]},
  {id:'c',name:'Olivia Bennett',img:44,time:'Today at 10:02 AM',text:'I’m taking a pottery class on Saturday and I’m equal parts excited and nervous haha',reactions:[['🥹',3],['✨',2]]},
  {id:'d',name:'Maya Patel',img:45,time:'Today at 10:16 AM',text:'That sounds so fun @Olivia Bennett! You have to show us what you make 🫶'},
  {id:'e',name:'Noah Williams',img:68,time:'Today at 10:24 AM',text:'A little reminder that our community hangout is tomorrow! Come as you are, we’d love to see you there.',card:true,reactions:[['💜',5],['👀',3]]}
 ],
 welcome:[{id:'w',name:'Sophie Chen',img:32,role:'HOST',time:'Monday at 9:00 AM',text:'Welcome to The Cozy Corner! ✨ We’re so glad you’re here. Make yourself at home, introduce yourself, and jump into any conversation that feels right.',reactions:[['💛',12],['👋',8]]}],
 introductions:[{id:'i',name:'Maya Patel',img:45,time:'Yesterday at 2:14 PM',text:'Hey everyone! I’m Maya, a designer, big-time playlist maker, and enthusiast of all things cozy. So happy to be here! 🌼',reactions:[['👋',6],['💜',4]]}],
 'share-your-work':[{id:'s',name:'Olivia Bennett',img:44,time:'Yesterday at 4:32 PM',text:'A little reminder: your work doesn’t have to be perfect to be worth sharing. What are you making lately? 🎨',reactions:[['✨',5]]}],
 'good-vibes':[{id:'g',name:'Jules Rivera',img:25,time:'Today at 8:10 AM',text:'You’re doing better than you think. Pass it on. 💛',reactions:[['💛',9]]}],
 recommendations:[{id:'r',name:'Marcus Lee',img:12,time:'Yesterday at 6:20 PM',text:'Looking for a new comfort show. What’s everyone watching lately? 🍿',reactions:[['👀',3]]}]
};
let state;
try { state = JSON.parse(localStorage.getItem(storageKey)); } catch { state = null; }
if (!state || !Array.isArray(state.channels) || !state.messages) state = {channels:structuredClone(defaultChannels),messages:structuredClone(seed),name:'Alex Morgan'};
state.name ||= 'Alex Morgan';
let currentChannel = 'general', replyTo = null, searchTerm = '';
const save = () => { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { toast('Could not save changes in this browser.'); } };
const avatar = (img, name, extra='') => `<span class="avatar ${extra}"><img src="https://i.pravatar.cc/100?img=${encodeURIComponent(img)}" alt="${escapeHtml(name)}" loading="lazy"><i></i></span>`;
function renderChannels(){
 $('#channel-list').innerHTML=state.channels.map(c=>`<button class="channel ${c.id===currentChannel?'active':''}" data-channel="${escapeHtml(c.id)}"><span class="channel-hash">#</span><span>${escapeHtml(c.name)}</span>${c.unread && c.id!==currentChannel?`<span class="unread">${c.unread}</span>`:''}</button>`).join('');
}
function renderMembers(){
 const member = p => `<div class="member ${p.away?'away':''}">${avatar(p.img,p.name)}<div class="member-info"><strong>${escapeHtml(p.name==='Alex Morgan'?state.name:p.name)}</strong><span>${escapeHtml(p.status)}</span></div></div>`;
 $('#online-members').innerHTML=people.filter(p=>!p.away).map(member).join('');
 $('#away-members').innerHTML=people.filter(p=>p.away).map(member).join('');
 $('#current-user').textContent=state.name;
}
function renderIntro(channel){
 const isGeneral=channel.id==='general';
 $('#channel-intro').innerHTML=`<div class="intro-content"><div class="intro-eyebrow">✦ &nbsp; ${isGeneral?'A LITTLE PLACE TO BELONG':'THE COZY CORNER'}</div><h1>${isGeneral?'Welcome to the corner.':`# ${escapeHtml(channel.name)}`}</h1><p>${isGeneral?'A space to share, connect, and make the everyday a little more special. We’re glad you’re here.':escapeHtml(channel.description)}</p><button data-action="${isGeneral?'guidelines':'invite'}">${isGeneral?'Get to know this space':'Invite your people'} &nbsp; ↗</button></div>`;
}
function renderMessages(scroll=false){
 const all=state.messages[currentChannel] || [];
 const messages=all.filter(m=>!searchTerm || `${m.name} ${m.text}`.toLowerCase().includes(searchTerm.toLowerCase()));
 $('#empty-search').hidden=messages.length>0 || !searchTerm;
 $('#messages').innerHTML=(messages.length?'<div class="date-divider">'+(searchTerm?'Search results':'Today')+'</div>':'')+messages.map(m=>{
 const text=escapeHtml(m.text).replace(/(@[\w]+(?: [\w]+)?)/g,'<span class="mention">$1</span>');
 return `<article class="message" data-message="${escapeHtml(m.id)}">${avatar(m.img,m.name,'message-avatar')}<div class="message-body">${m.reply?`<div class="reply-context">Replying to ${escapeHtml(m.reply)}</div>`:''}<div class="message-header"><strong>${escapeHtml(m.name)}</strong>${m.role?`<span class="role-badge">${escapeHtml(m.role)}</span>`:''}<span class="message-time">${escapeHtml(m.time)}</span></div><div class="message-text">${text}</div>${m.card?'<div class="chat-card"><div class="chat-card-icon">✦</div><div><strong>Community Hangout</strong><span>Tomorrow · 6:00 PM &nbsp; • &nbsp; The lounge</span></div><button data-action="events" aria-label="View event">↗</button></div>':''}${m.reactions?.length?`<div class="reactions">${m.reactions.map(([emoji,count,chosen],i)=>`<button class="reaction ${chosen?'chosen':''}" data-reaction="${i}" aria-label="React ${escapeHtml(emoji)}">${escapeHtml(emoji)} &nbsp;${count}</button>`).join('')}</div>`:''}</div><div class="message-tools"><button data-message-action="react" title="React">☺</button><button data-message-action="reply" title="Reply">↩</button>${m.own?'<button data-message-action="delete" title="Delete">×</button>':''}</div></article>`;
 }).join('');
 if(scroll) $('#chat-scroll').scrollTop=$('#chat-scroll').scrollHeight;
}
function render(scroll=false){
 const channel=state.channels.find(c=>c.id===currentChannel) || state.channels[0]; currentChannel=channel.id;
 $('#header-channel').textContent=channel.name; $('#header-description').textContent=channel.description;
 $('#message-input').placeholder=`Message #${channel.name}`; renderChannels();renderMembers();renderIntro(channel);renderMessages(scroll);
}
function toast(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2600)}
function modal(title,body){$('#modal-content').innerHTML=`<h2 id="modal-title">${escapeHtml(title)}</h2>${body}`;$('#modal-backdrop').hidden=false;setTimeout(()=>$('#modal-content input')?.focus(),20)}
function closeModal(){$('#modal-backdrop').hidden=true}
function changeChannel(id){if(!state.channels.some(c=>c.id===id))return;currentChannel=id;searchTerm='';replyTo=null;$('#reply-preview').hidden=true;const c=state.channels.find(c=>c.id===id);c.unread=0;save();render(true);$('#app').classList.remove('menu-open');closeModal()}
function addMessage(text){const now=new Date();state.messages[currentChannel] ||= [];state.messages[currentChannel].push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name:state.name,img:47,time:'Today at '+now.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}),text,own:true,reply:replyTo});replyTo=null;$('#reply-preview').hidden=true;searchTerm='';save();renderMessages(true)}
$('#message-form').addEventListener('submit',e=>{e.preventDefault();const input=$('#message-input');const text=input.value.trim();if(!text)return;addMessage(text);input.value='';input.focus()});
document.addEventListener('click',async e=>{
 const channel=e.target.closest('[data-channel]');if(channel){changeChannel(channel.dataset.channel);return}
 const reaction=e.target.closest('[data-reaction]');if(reaction){const message=state.messages[currentChannel].find(m=>m.id===reaction.closest('[data-message]').dataset.message);const r=message.reactions[Number(reaction.dataset.reaction)];r[1]+=r[2]?-1:1;r[2]=!r[2];save();renderMessages();return}
 const tool=e.target.closest('[data-message-action]');if(tool){const message=state.messages[currentChannel].find(m=>m.id===tool.closest('[data-message]').dataset.message);if(tool.dataset.messageAction==='reply'){replyTo=message.name;$('#reply-preview').innerHTML=`Replying to <strong>${escapeHtml(replyTo)}</strong><button data-action="cancel-reply">×</button>`;$('#reply-preview').hidden=false;$('#message-input').focus()}if(tool.dataset.messageAction==='delete'){state.messages[currentChannel]=state.messages[currentChannel].filter(m=>m.id!==message.id);save();renderMessages()}if(tool.dataset.messageAction==='react'){message.reactions ||= [];let r=message.reactions.find(r=>r[0]==='💜');if(!r)message.reactions.push(['💜',1,true]);else {r[1]+=r[2]?-1:1;r[2]=!r[2]}save();renderMessages()}return}
 const button=e.target.closest('[data-action]');if(!button)return;
 switch(button.dataset.action){
 case 'mobile-menu':$('#app').classList.toggle('menu-open');break;
 case 'members':if(innerWidth<=620)document.body.classList.toggle('show-mobile-members');else document.body.classList.toggle('hide-members');break;
 case 'close-modal':closeModal();break;
 case 'cancel-reply':replyTo=null;$('#reply-preview').hidden=true;break;
 case 'home':changeChannel('general');break;
 case 'workspace':toast('You’re already in The Cozy Corner.');break;
 case 'workspace-menu':modal('The Cozy Corner','<p>Your happy place for good people and good conversations.</p><div class="modal-list"><button data-action="invite">↗ &nbsp; Invite your people</button><button data-action="create-channel"># &nbsp; Create a channel</button><button data-action="guidelines">✦ &nbsp; Community guidelines</button></div>');break;
 case 'invite':modal('Bring your people along','<p>Good conversations are even better with friends. Share this link to invite them to the Huddle demo.</p><label>INVITE LINK</label><input id="invite-link" readonly><button class="modal-primary" data-action="copy-invite">Copy invite link</button>');$('#invite-link').value=location.href.split('#')[0];break;
 case 'copy-invite':try{await navigator.clipboard.writeText($('#invite-link').value);toast('Link copied to your clipboard!')}catch{$('#invite-link').select();toast('Select and copy the link above.')}break;
 case 'create-channel':modal('Create a channel','<p>Make a little space for a new conversation. Channels are saved in this browser.</p><form id="create-channel-form"><label for="new-channel">CHANNEL NAME</label><input id="new-channel" placeholder="e.g. book-club" maxlength="30" required><button class="modal-primary" type="submit">Create channel</button></form>');break;
 case 'profile':case 'settings':modal('Your profile','<p>Make yourself at home. Your name is saved on this device.</p><form id="profile-form"><label for="profile-name">DISPLAY NAME</label><input id="profile-name" maxlength="30" required><button class="modal-primary" type="submit">Save changes</button></form>');$('#profile-name').value=state.name;break;
 case 'search':modal('Find a conversation','<p>Search messages in this channel, or jump to a channel below.</p><form id="search-form"><label for="search-input">SEARCH MESSAGES</label><input id="search-input" placeholder="What are you looking for?"><button class="modal-primary" type="submit">Search channel</button></form><div class="modal-list">'+state.channels.map(c=>`<button data-channel="${escapeHtml(c.id)}"># &nbsp; ${escapeHtml(c.name)}</button>`).join('')+'</div>');break;
 case 'browse':modal('Browse channels','<p>Find a conversation that feels like you.</p><div class="modal-list">'+state.channels.map(c=>`<button data-channel="${escapeHtml(c.id)}"># &nbsp; ${escapeHtml(c.name)}</button>`).join('')+'</div>');break;
 case 'events':modal('Community hangout','<p>Tomorrow · 6:00 PM · The lounge</p><p>Come as you are for a relaxed community catch-up. Bring a drink, a story, or just yourself. 💜</p><button class="modal-primary" data-action="event-interest">I’m interested</button>');break;
 case 'event-interest':closeModal();toast('You’re on the list!');break;
 case 'guidelines':modal('A little space for everyone','<p>Be kind. Be curious. Make room for others. Share what inspires you, respect people’s boundaries, and help make this a place where everyone feels at home.</p><button class="modal-primary" data-action="close-modal">Sounds good ✨</button>');break;
 case 'pins':modal('Pinned messages','<p>Nothing pinned here yet. The best conversations are still ahead of us. ✨</p>');break;
 case 'notifications':toast('You’re all caught up ✨');break;
 case 'emoji':$('#message-input').value+=' ✨';$('#message-input').focus();break;
 case 'gift':$('#message-input').value+=' 💛';$('#message-input').focus();break;
 case 'attachment':toast('Attachments aren’t available in this local demo.');break;
 case 'voice':toast('Voice chat isn’t available in this local demo.');break;
 case 'create-server':case 'discover':modal('More spaces, more connection','<p>Huddle is currently a local demo of The Cozy Corner. Creating and discovering live communities requires a connected backend.</p>');break;
 case 'help':modal('A little help','<p>Choose a channel to explore, send a message, add a reaction, or invite a friend to try the demo. Your messages and settings are saved in this browser.</p><p>Huddle is a static demo: messages, invitations, and events are not synced between people, and voice chat is not connected.</p>');break;
 }
});
document.addEventListener('submit',e=>{
 if(e.target.id==='create-channel-form'){e.preventDefault();const name=$('#new-channel').value.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');if(!name){toast('Please enter a channel name.');return}if(state.channels.some(c=>c.id===name)){toast('That channel already exists.');return}state.channels.push({id:name,name,description:'A little space for your conversations'});state.messages[name]=[];save();changeChannel(name);toast('Channel created!')}
 if(e.target.id==='profile-form'){e.preventDefault();const name=$('#profile-name').value.trim();if(!name)return;state.name=name;save();render();closeModal();toast('Profile updated!')}
 if(e.target.id==='search-form'){e.preventDefault();searchTerm=$('#search-input').value.trim();closeModal();renderMessages();toast(searchTerm?`Searching for “${searchTerm}”`:'Showing all messages')}
});
$('#modal-backdrop').addEventListener('click',e=>{if(e.target.id==='modal-backdrop')closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();$('#app').classList.remove('menu-open')}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();document.querySelector('[data-action="search"]').click()}});
render(true);
