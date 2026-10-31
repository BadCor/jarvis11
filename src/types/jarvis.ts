export type CommandCategory = 'all' | 'apps' | 'web' | 'ai' | 'custom' | 'system';

export type ActionType = 'agent_command' | 'web_open' | 'system_toggle';

export interface VoiceCommand {
  id: string;
  name: string;
  phrase: string;
  triggers: string[];
  category: CommandCategory;
  iconName: string;
  actionType: ActionType;
  commandValue: string;
  description: string;
  isCustom?: boolean;
}

export type AgentStatus = 'connected' | 'disconnected' | 'connecting';

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: 'voice_heard' | 'command_sent' | 'agent_success' | 'agent_error' | 'gesture_detected' | 'system_info';
  source: 'user' | 'jarvis' | 'agent' | 'gesture';
  title: string;
  detail?: string;
  status?: 'nominal' | 'success' | 'warning' | 'error';
}

export type JarvisPhase = 'idle' | 'listening' | 'processing' | 'speaking' | 'disabled';

export type DetectedGesture = 'none' | 'palm' | 'fist' | 'victory' | 'point' | 'thumb_up';
