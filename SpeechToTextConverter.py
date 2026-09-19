from dotenv import load_dotenv
from io import BytesIO
import requests 
from typing import List, Annotated 
from fastapi import FastAPI, File, UploadFile  
from elevenlabs.client import ElevenLabs
import anthropic 

''' This program will take a video file that's given to it and using the ElevenLabs API, we want
to scrape through it and generate a transcript. With that transcript, we'll feed it into Claude so 
it can come up with a plan for investors / small startups so they can know what businesses or people 
would be willing to invest in their business  
 come up with some good keywords to prompt claude 
 Also, should have it quote stuff at time stamps in the video. This can be done by using 11 Labs' 
 built in function to record timestamps for things said '''

load_dotenv()
client = ElevenLabs(api_key = "MY_KEY")
claude = anthropic.Anthropic()  
app = FastAPI() 

'''Supports reading multiple uploadingvideos at once and then using 11 labs to parse through 
the videos to generate a transcript '''
@app.post("transcribe")
async def transcribe (videos: Annotated[List[UploadFile], File()]):
    results = []
    for video in videos: 
        content = await video.read() 
        transcript = client.speech_to_text(file = BytesIO(content), model_id = "scribe_v2", tag_audio_events = True, language_code = "None", diarize = True )
        results.append({"Video name": video.filename, "transcript": transcript.text}) 
    return results 













