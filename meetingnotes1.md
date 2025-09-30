Sep 23, 2025
Woodstock <> AiPRL Onboarding - Transcript
00:00:00
 
Derek Dicks: Okay, super. I just sent off the Renee invite, so that'll be uh top of your inbox then. Um I know you uh Jessica and Jean had met with Colin and I believe with Malcolm already. I was not able to make that meeting.
Jessica Carrasquillo: Mhm.
Derek Dicks: Um Jean, if you want to possibly take over unless there's anything else, Kevin, that you want to hit on first. I was going to do an update with what they figured out and uh get us all on the same page.
Kevin Clemmons: Nope, I'm good.
Derek Dicks: Okay, super.
Jean De Lasse: Yeah. Okay. Um I I'll just I'll uh just jump right into it then. Um Jessica, you uh I did see your email. I'm sorry that I haven't got a chance to reply uh regarding the um opportunity to give feedback on these uh on these bills, right? Um, I wanted to get you guys the uh JS insert. Uh, it is pretty much uh pretty much uh ready to to be put on your guys's uh uh development um uh yeah server.
 
 
00:01:08
 
Jean De Lasse: And um well, Malcolm's not here, but this is going to be recorded anyways. Uh I wanted to if possible just briefly go over um you know I I know there are a couple of of bugs uh Jessica and to answer your question I'll also send you a document uh where I have uh the documented current bugs um where um maybe that would be a nice place for us to keep keep keep track of those as as um as I work through solving those. Um, and yeah, that that being said, uh, I'll jump right straight into it. What, uh, we, uh, we were talking about was a solution to have, um, um, on your website. Okay. And sorry for the clutter. On your website, um, here the chat bubble that's going to be replacing this one.
Jessica Carrasquillo: Yeah, that's not our though.
Jean De Lasse: Uh, can Oh, okay.
Jessica Carrasquillo: Just by the way, that's a different that's a different one like a state over.
Jean De Lasse: What's it?
 
 
00:02:15
 
Jessica Carrasquillo: I think they're in Alabama. Uh but we are woodstockoutlet.com. Yep, that one's us.
Jean De Lasse: Beautiful. Okay, perfect. That looks better. Okay, I'll I actually wanted to use this logo, but then I think I had already committed to the incorrect one uh for our um well for this um for these chats uh right uh here.
Jessica Carrasquillo: Right.
Jean De Lasse: I will change that right away as well. Um I do like yours better.
Derek Dicks: That's an easy
Jean De Lasse: Um okay so the idea that we have here is to have uh on our bubble that we're going to give you guys um we can in we can have uh just a listener right uh in simple terms so that every time somebody visits this page and I will just refresh it in here in real time every time somebody uh visits the page things are logged logged, right? Uh events, we have we keep a log of those events. Um right here, this is this was me just refreshing the page, right?
 
 
00:03:35
 
Jean De Lasse: Since I had already visited the page, I have uh also included a counter. Um now, this is going to serve us serve a double purpose here. The original purpose of this was for um a different uh client that just wanted to track UTM parameters so that we could send uh a personalized teaser here when and what I mean by a teaser is just the message that comes up here. This one says need furniture help chat with us. Uh chat chat with this AI. This message right here can be changed in real time. So the idea was to track where the user was navigating, right? Uh what's the page that they're seeing, right? Right here. It's uh this is just a test page, but every time they're navigating, uh the page itself, right, the page itself most of the times will have traces of where the user comes from. Maybe it's from Facebook ads or maybe there's something else in there.
 
 
00:04:42
 
Jean De Lasse: In our particular case, just to get everyone on the same page, Malcolm had uh agreed to add um for users that were logged in to their Magento account. Uh for those users that were navigating here, but they were already logged in, their URL would contain um a customer ID and possibly an email, a customer email, right? And this is what we uh that what we can use to treat uh the you know to identify the user on the back end. So um ultimately this is where um well this is uh this is where we would do this on the back end. So um yeah that's that's essentially it uh right now what we can uh uh demo as a you know form of communication between this chat which would be on your website and our back end is uh right now is uh read only okay I can open the chat okay and opening the chat is going to also trigger uh a log Right. And now with this session, right, with this session ID, which basically means this person, you know, in the Mexican Caribbean and this computer at this time a day opened it.
 
 
00:06:10
 
Jean De Lasse: So uh or or navigated here. So if they are logged in, we will be able to know uh who they are. So instead of having them uh pointed to the login screen, we could ask confirmation questions, right? Such as maybe the beginning for beginning digits of your address only or or the last three digits of your zip code or anything that can um make us confirm or make April confirm that she's speaking with the correct um client. And well, yeah, continue continue the the the client's journey from there. Um, does this make sense so far?
Jessica Carrasquillo: Yes.
Derek Dicks: I think it does. I do. Do we need to have another verification step if they're already logged in? Can we just use that as the sole verification and then the chat doesn't have to do anymore? Or do you feel like um Kevin that we do need to have another checkpoint just to make sure it's not the wife or the husband? But if they're using the same computer or the same login credentials, it does it need to have anything else to verify them or Jessica suggestion or Colin I I feel like it almost did its job right there which
 
 
00:07:22
 
Kevin Clemmons: Um, that's a good one.
Derek Dicks: would be amazing to go ahead and go straight to all but if there's We could do another gate step on if they looking to get into like actual you know privacy data for that customer that
Kevin Clemmons: Yeah, it looked fine right there. I'm just wondering if I'm trying to think if there's another way it could be worked around, you know?
Colin Vander Veen: Another our conversation.
Kevin Clemmons: Um,
Derek Dicks: maybe we do another checkpoint There
Jean De Lasse: Yes. And and actually this Yeah, that's actually a good idea. I think we shouldn't replace our original idea of uh two-step or or OTP verification, right? where uh the exchange if the people if the user is logged in the exchange could actually be made a little simpler. April could tell me if I'm logged in and April knows who I am right by my customer ID.
Derek Dicks: heat.
Jean De Lasse: Uh April can say, "Hey, um I notice that your session or or something like that, right? I notice that you're logged in as um John.
 
 
00:08:30
 
Jean De Lasse: Are you John?" Maybe not the full name. or are you J, you know, are you John? And once confirmed, we could still do the uh Okay. Well, just to make sure, John, that no one is on your computer where, you know, or you forgot to log out or something like that, let me just send you a verification text real quick to uh you know, uh finish that.
Derek Dicks: Yeah, we could look at whatever fields are are populated.
Jean De Lasse: Right.
Derek Dicks: So if they have no phone number, we wouldn't say that. If they have email, we would say that instead we would just pull from whatever currently have in their database for that account and use that as the OTP.
Jean De Lasse: Hey.
Derek Dicks: Correct.
Jean De Lasse: Yes. Yes, that's correct. Mhm.
Derek Dicks: What do you guys feel about that?
Colin Vander Veen: Yeah, I just I it sounds good.
Derek Dicks: Colin, I apologize. You were gonna say
Colin Vander Veen: I just wouldn't let that seems a little complicated, I guess.
 
 
00:09:19
 
Colin Vander Veen: And I think we need to move forward a little faster. Um let's just see if we can get let's put that on the step two.
Derek Dicks: Okay.
Colin Vander Veen: I think as long as they get if they get logged into Magenta, they're logged into Magenta.
Derek Dicks: Yeah.
Colin Vander Veen: They had to get there somehow. They can self sign up and that's fine. But without a loft connection, there ain't nothing to there ain't nothing to talk about. So the loft without until they get the loft connector the the conversation of the verification with the user in Magento and the you and the and the account in loft that's actually more of a Magento problem that maybe April can help with. Do you know what I mean?
Jean De Lasse: Oh yeah.
Colin Vander Veen: And I think because that's a that's kind of what we were talking about.
Jean De Lasse: Yes.
Colin Vander Veen: you know, we were on with um our our developer and and he was we've always had that problem of how are we going to make sure we're linking the two the correct two together.
 
 
00:10:14
 
Colin Vander Veen: So, that's a again that's a Magento account issue. Um yeah, so I I I like all those ideas you just said. I just don't know that now's I think that if I'm tell me if I'm wrong Jess and Kevin but I think we need to move a little faster on this to at least get at least get some conversation started. We don't necessarily have to spill a bunch of details and even if you throw out like I we said before you know please give me your street address number you know let me just verify that we've got the correct order. What's your street address and number? you know, it's it's 100 and they go, "Oh, yeah. We've got that on file. Okay, let's continue." You know, I mean, when we get into the order conversations, No, no.
Jean De Lasse: Right.
Derek Dicks: Got
Jean De Lasse: Oh, okay. Yeah. No, I uh apologies. I I guess uh I didn't clarify there.
 
 
00:11:09
 
Colin Vander Veen: I'm I'm glad you said that.
Jean De Lasse: We could we could take the Magento ID that uh so the the ID that the customer is navigating with um and we understand it is the Magento ID, their customer ID and their email.
Colin Vander Veen: I think you should. Yeah.
Jean De Lasse: So what we would do is uh you know mer a dduplication here where before messaging uh that hey are you John right I'm going to check well April is going to check because April has also the loft endpoints to search by name uh sorry search by phone or email so you know we would just uh we would just see if the if loft user exists for for me if I'm navigating.
Colin Vander Veen: Yeah, but magenta has
Jean De Lasse: If there's a loft user for me, then there are orders for me. And then April can say, okay, uh well, it seems like I do have your uh I think you guys uh on the website call it legacy system, but we can say I do have your order information and go from there, right?
 
 
00:12:09
 
Jean De Lasse: But if it doesn't have a user or if the user exists but does uh doesn't have orders, maybe we can say uh well actually not say anything at that point, right? Because being authenticated to Magento will not grant it.
Colin Vander Veen: Yeah, sorry. But again, it sounds like we've we've missed something because Magento has the loft ID. Yes, it's not in your query string, but it's available via API or he might be able to put it somehow, I don't know, in a in the Yeah, that was part of our walk we did.
Jean De Lasse: Oh, nice. That would that would be one one step less.
Colin Vander Veen: Remember when we did our walkthrough? When you sign up in Magento, after you give Magento your username and your email and all that information, once you sign up in here, it's it's going to try to synchronize you via phone number to your uh Loft accounts. Am I right, Jessica?
Jessica Carrasquillo: Yes, that's correct.
Colin Vander Veen: Right. So, now Magento has at least one, we're hoping, right?
 
 
00:13:14
 
Colin Vander Veen: if they have an account, they might have 10 because their phone number might have been used a bunch or something.
Jessica Carrasquillo: Yeah.
Colin Vander Veen: Who knows? But anyway, because there are multiple accounts in law for multiple people. So, or or for everybody. Um anyway, that's not the issue at that point. You know, obviously when they start talking about orders, we're going to be talking about a specific order and that order will be tied to an account and that account ID should be in the list uh in the multilelist in the magenta. Now again, what you were just talking about is all great too, which is just double verification, you know, and maybe down the road, uh, April can help, um, um, with M Magento finding more loft, let's call it affiliates,
Derek Dicks: Yeah.
Colin Vander Veen: affiliate accounts, because again, that that's up to the web team and Jessica and the web team, They log in and they if they find more links than the customer found, they put them in. Am I right, Jess?
 
 
00:14:20
 
Jessica Carrasquillo: Uh I don't think we do anything with the users in that way. No here.
Colin Vander Veen: Oh, okay. Well, that was in the beginning when we first were building it. That was one of the options was they can search for themselves but if they don't find themselves administrators and and or web team users of the back end of Magento can add more loft ids to a customer in Magentto.
Jessica Carrasquillo: Then I need to get with Renee about that and see if that's something they do because that's not something right in the user profile for it.
Colin Vander Veen: Yeah. because that's a field. There's a field in the backside of right and they could well it's just it's because the customer may or may not know how to do that phone number search. Do you know what I mean? Anyway, but but if again with API and all this this conversation between all three of us, um April might even be able at that point to help um fulfill some more data.
 
 
00:15:01
 
Jessica Carrasquillo: Mhm.
Colin Vander Veen: Anyway, that's again that's down the road. We'll keep going on that.
Jessica Carrasquillo: Yeah, I mean that's that's all like good stuff and verification and you know, but I'm at this point I think I'm really focused on trying to get April to have a consistent coherent conversation.
Colin Vander Veen: Yeah. Yeah. And get some uh get some product on there. I think we saw that the other day. I think he showed us the the we were looking at the wrong API or we were looking at the wrong wrong dashboard and then and we were like, "We don't see anything."
Jessica Carrasquillo: Right. I Yeah.
Colin Vander Veen: And and Jean was like, "Oh, you're looking at the wrong place." We were like, "Oh my god."
Jessica Carrasquillo: So, we we have the new ones, but there's definitely a lot of, like I said, that's why I emailed about giving feedback on these conversations because there's still a lot of glitchy things.
Colin Vander Veen: So, yeah. Did Did they Did Jean um um did he affirm did he uh did he agree that the cap still the caps lock key still works for that or what did we decide on that the the feedback?
 
 
00:16:12
 
Jessica Carrasquillo: Yeah. So, I believe John Jean said at the beginning he was going to send over a spreadsheet where he's working through some bugs, right?
Colin Vander Veen: Oh, cool. Oh, okay. I I heard something about that. Okay, cool.
Jean De Lasse: Yes. Yeah, that's that's correct.
Colin Vander Veen: Cool.
Jean De Lasse: That's correct.
Jessica Carrasquillo: Okay.
Jean De Lasse: I I'll share that with you guys. Um it's brief.
Colin Vander Veen: That'd be awesome.
Jessica Carrasquillo: Perfect.
Jean De Lasse: Uh so that um I keep track of it and and can and can work through that for sure.
Jessica Carrasquillo: Okay.
Colin Vander Veen: Now, is this a sandbox uh backend that we could get into? Uh like that. When I say sandbox, I just mean demo. Or is it some kind of live or what is this?
Jean De Lasse: Uh yeah, this this this back end you mean for the uh for the UTM parameters for the login?
Colin Vander Veen: Yeah. Yeah.
 
 
00:16:55
 
Jean De Lasse: Yes. Uh yeah, the idea was to give you guys this uh as a JS insert so that the parameter that Malcolm puts for customer ID or website or um sorry uh email uh get tracked and also the session so
Colin Vander Veen: Okay. Good. Okay. Yeah. Yeah.
Jean De Lasse: that they can be used for that session.
Colin Vander Veen: Okay.
Jean De Lasse: Um, yeah, we can give I can uh Yeah, I this is what I promised to give you last meeting.
Colin Vander Veen: Okay. Good. Because you said there's a there's a back there's a management there's a management portal andor agent portal, right? I'm just I'm just trying to get updated on as to how close we are to actually, you know, um spinning something up. I mean I know we get this demo running we get attached um to the demo site the development site I should say not demo but the development site and then we can see it in action on the screen and then while we're doing it we can also um reach the portal to kind of see the backside of what the agents would see.
 
 
00:17:59
 
Kevin Clemmons: My mommy.
Colin Vander Veen: You think we're a week out on that.
Jean De Lasse: Uh yeah, for the week for the uh for the agents. Uh you mean your your internal inbox, right?
Colin Vander Veen: Yeah. Okay.
Jean De Lasse: The the other side of this conversation, right? Because this is this is what Yeah.
Colin Vander Veen: Correct. The backside. The agent. The agent that works for Woodstock.
Jessica Carrasquillo: Yeah.
Derek Dicks: The Human.
Colin Vander Veen: The hum.
Jean De Lasse: Yes.
Colin Vander Veen: Yeah. The the the agent. Cool. I've never seen it. That's why I'm asking. I can't wait to see it. I finally saw some AI working the other day. Now I can't wait to see the back.
Jessica Carrasquillo: Yeah. I mean, send if you send Malcolm whatever you need done on his side and he'll he'll get it taken care of.
Jean De Lasse: Oh, understood.
 
 
00:18:37
 
Jean De Lasse: Yes.
Colin Vander Veen: Well, make sure you tell us what what you're doing, too.
Jessica Carrasquillo: Well, yeah.
Colin Vander Veen: So, yeah, please do.
Jessica Carrasquillo: Include us in in that communication.
Colin Vander Veen: I do want to know how it's working.
Jessica Carrasquillo: So, yes.
Jean De Lasse: Yes.
Colin Vander Veen: Awesome.
Jean De Lasse: Okay. No, absolutely. Absolutely. Um, yeah, it's a it's a very short script. Uh, everything is is going to be controllable. My everything about the the uh widget itself, right?
Colin Vander Veen: Yeah.
Jean De Lasse: uh the icon, this little online thingy, the sizes. Uh there's this um um kind of like a a layer that uh gets applied on the rest of the screen.
Colin Vander Veen: Heat.
Jean De Lasse: It's still usable. You can still uh scroll around, but it kind of gives some protagonism to the uh to the web chat.
Colin Vander Veen: Right.
Jean De Lasse: And yeah, part of the feedback is, you know, we can do whatever you guys would like.
 
 
00:19:40
 
Jean De Lasse: We can put it on this size uh side, sorry, on this other side. Some of their clients are going with a with a widget that opens almost, you know, in the uh centered of the screen.
Derek Dicks: center screen.
Colin Vander Veen: modal.
Jean De Lasse: Uh the reason for that is that there is um you know there is uh it's it's it's just better for when the the data is like that. Here I I'll show an example. Uh this one is on a dashboard but with some transparency it shows in the middle of the screen.
Jessica Carrasquillo: Right.
Jean De Lasse: The reason for that is uh just uh the reason.
Derek Dicks: We can put so many more detailed suggestions on other, you know,
Jessica Carrasquillo: I mean, that's, you know, that's getting to styling and how we want it to pop up, but right now we still focus on function.
Colin Vander Veen: Yeah, we just want to see it work.
Jessica Carrasquillo: You know, we
Colin Vander Veen: Yeah.
Jean De Lasse: Yeah. No, absolutely.
Colin Vander Veen: I don't care what color it is.
 
 
00:20:39
 
Jean De Lasse: Absolutely. That that part we can we can address it for sure. So, I I'll just give you guys this um this JS that's pretty standard bottom right uh and we can put it on the development uh site and and that will be that will be very quick to to to
Colin Vander Veen: Okay.
Jean De Lasse: give us that uh login side and then like you guys said that can be secondary while we focus on I guess now the the whole prompting and the whole uh interaction. with the functions side.
Colin Vander Veen: How and how is the um data scraping or however it is you're kind of building your catalog um product kind of catalog. How's that coming?
Jean De Lasse: So, we're not we're not really scraping it. We uh we are just going to be using the endpoints for for Magento directly uh with uh with a little bit of a cleanup function for what whichever you know whichever endpoint returns like you know just limit the
Colin Vander Veen: Okay.
Jean De Lasse: amount of uh of of u elements that appear right on the screen at the same size uh at the same time.
 
 
00:21:58
 
Colin Vander Veen: So your so your API your your API calling if I asked you for product information you're getting that from a a cache local synchronized database you're getting that in real time from an API call
Jean De Lasse: Sorry.
Colin Vander Veen: how how are you doing Okay, perfect.
Jean De Lasse: Yes, it's it's in real time from an API call to Magento and then and then uh just rendered as HTML by the
Colin Vander Veen: Okay, so so when you So my question kind of was how where are we with that in our project stat, you know, timeline, but it sounds like if you just once you get that working, which you may have already done, um that's all we it's it's working. It's ready.
Jessica Carrasquillo: Well, again, this is where I would definitely need to do feedback.
Colin Vander Veen: Okay, this is Yeah, this is where Yeah, this is okay.
Jessica Carrasquillo: It's getting it's getting better, but I mean, even earlier today, I asked for a reclining couch, and it gave me a list of recliners and then was like, "Did you mean a couch?"
 
 
00:22:50
 
Colin Vander Veen: Good. Well, I see. Yeah.
Jessica Carrasquillo: I was like, "Yes."
Colin Vander Veen: Yeah. Yeah. Well, I mean, yeah.
Jessica Carrasquillo: So,
Derek Dicks: Right.
Jean De Lasse: I see that.
Colin Vander Veen: Yeah.
Jean De Lasse: I see.
Colin Vander Veen: I can't wait to see it. So,
Derek Dicks: And I'd say as far as the the prompting side, that's just for the logic. It does make a dramatic difference on the experience for you as you're asking for things and you get the wrong thing. But I will say that's the easiest thing for us to do because we have a whole team that does the prompting side of things. um whereas Jean is the main point person for building the infrastructure and all the foundational stuff. So as we get you using it and get you um you know access point to push back and say this has given me this it should have done that that's all the logic that we can do pretty quick real time for you it feels like everything's arai but as long as the functions are working and you're getting images that goes back to Colin's point of the connections are made we're basically there now we just need to
 
 
00:23:41
 
Jessica Carrasquillo: Okay, great.
Derek Dicks: go teach it a little bit more personality stuff and some guard rails to what it should and shouldn't do whenever certain phrases are mentioned.
Jessica Carrasquillo: Right.
Derek Dicks: mentioned. Um that's a quick update, not a full infrastructure build. So um and that would be um I mean you can continue doing emails as as you wish.
Jessica Carrasquillo: Okay.
Colin Vander Veen: Okay.
Derek Dicks: The Slack channel is great for that too. You'll have ability to have the little button down there to to give us issue update with the form that pops up or just type it out. Um if you have certain people uh it might be Kevin question. If Kevin has some people that he wants just to have somebody you know sitting at a desk not doing much but you know they know enough about your uh you know they have domain expertise enough that they can go through and just start asking a bunch of questions and then just log some things in. We we have um our own team too. So we we were just making sure things are getting to the point where we would release our own internal testers and I don't think they've went to town on this yet.
 
 
00:24:47
 
Derek Dicks: So, that'll be a first big hit that we'll do and then once we hand it to you and you get back in access and all that sort of stuff, um we'd love to have the finishing touches come back to from from you guys for the prompting.
Kevin Clemmons: Sure.
Jessica Carrasquillo: Right. And that's gonna, like I said, Renee is going to probably run point on really trying to help brain in anyone on her team, you know, slow slow roll out on that because obviously they have their own load of
Derek Dicks: Okay.
Jessica Carrasquillo: things to get done. But, um, that's why we definitely want to pull her in at this point.
Colin Vander Veen: Well, and that'll help with the Yeah. front-end testing and um backend um education, learning how to learning how to post
Jessica Carrasquillo: Yep.
Derek Dicks: Okay. Well, perfect. Let's do this on our side. We'll have our um testing team run circles on this between now and our meeting next week. Um so that'll be something we can commit to.
 
 
00:25:36
 
Derek Dicks: And then as far as backend access, Jean, how do you feel like we'd have access for them to have backend access by next week? Is that good enough time frame or okay?
Jean De Lasse: That is realistic. Yes, that is. Yes, that is realistic. we can give you guys access to the inbox uh the back end uh uh by our next meeting by our next Tuesday.
Derek Dicks: Those would be some good deliverables. And then we have the spreadsheet of bugs that you can do between now and then that they can go through um and that would help as well. And then any other details that come up, we can talk about that as far as the CSS and any other customization aspect. But we'll put that on second priority. Just getting it getting it where we need to personalitywise and and function wise.
Jessica Carrasquillo: Yeah, sounds great.
Derek Dicks: Does that sound good?
Jessica Carrasquillo: Yep, sounds like a plan.
Kevin Clemmons: Yep, sounds good.
Colin Vander Veen: We're
Jessica Carrasquillo: All right.
Derek Dicks: Well, super. Thank you, Jean, for that update. I I didn't get to see the notes on that, so that was good for me to hear, too. Um, do you guys have any other questions? Is there anything else that comes up that um you'd like to see between now and then, or does this seem like a good list?
Jessica Carrasquillo: No, I think that that sounds good. Great. All right. Well, thank you guys for your time.
Colin Vander Veen: Wait.
 
 
Transcription ended after 00:27:08

This editable transcript was computer generated and might contain errors. People can also change the text after it was created.
