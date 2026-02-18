
export interface ProductData {
  name: string;
  type: string;
  gender: string;
}

export interface SceneManifest {
  scene_id: number;
  role_in_video: string;
  visual_locking: {
    character: string;
    background: string;
    identity_mapping: string;
  };
  voice_over: {
    script: string;
    gender: string;
    vocal_profile: string;
    word_count_check: string;
  };
  motion_engine: {
    profile: string;
    parameters: string[];
  };
  timing: string;
}

export interface AngleResult {
  angle_number: number;
  angle_name: string;
  emotion: string;
  hook_text: string;
  image_prompt: string;
  video_json: {
    scene: string;
    character: { gender: string };
    voice_over: { script: string };
  };
}

export interface VoiceOption {
  name: string;
  model: string;
  gender: string;
}

export interface AccentOption {
  label: string;
  value: string;
  details: string;
}
