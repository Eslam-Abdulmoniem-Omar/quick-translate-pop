import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      throw new Error('No audio file provided');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log('Transcribing audio file:', audioFile.name, 'Size:', audioFile.size, 'Type:', audioFile.type);

    // Get the audio data as array buffer
    const audioBuffer = await audioFile.arrayBuffer();
    
    // Determine file extension from mime type
    let extension = 'webm';
    if (audioFile.type.includes('mp4')) {
      extension = 'mp4';
    } else if (audioFile.type.includes('ogg')) {
      extension = 'ogg';
    } else if (audioFile.type.includes('wav')) {
      extension = 'wav';
    }
    
    // Create a new File with explicit type for OpenAI
    const newFile = new File([audioBuffer], `audio.${extension}`, { 
      type: audioFile.type || 'audio/webm'
    });

    // Create form data for OpenAI Whisper API
    const apiFormData = new FormData();
    apiFormData.append('file', newFile);
    apiFormData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Whisper API error:', response.status, errorText);
      throw new Error(`OpenAI Whisper API error: ${response.status}`);
    }

    const transcription = await response.json();
    console.log('Transcription result:', transcription.text);

    return new Response(JSON.stringify({ text: transcription.text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Transcription error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
