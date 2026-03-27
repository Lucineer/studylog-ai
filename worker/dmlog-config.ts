/**
 * DMlog.ai custom configuration loader.
 * Loads personality, rules, theme, and templates from KV.
 */
import type { Env } from '../../src/types';

export interface DMLogConfig {
  personality: string;
  rules: any;
  theme: string;
  templates: Record<string, string>;
}

/**
 * Load DMlog.ai custom configuration from KV.
 */
export async function loadDMLogConfig(env: Env): Promise<DMLogConfig> {
  try {
    const [personality, rulesRaw, theme] = await Promise.all([
      env.KV.get('config:personality') || '',
      env.KV.get('config:rules') || '[]',
      env.KV.get('config:theme') || '',
    ]);

    let rules: any[] = [];
    try {
      rules = JSON.parse(rulesRaw);
    } catch (e) {
      console.error('Failed to parse rules JSON:', e);
    }

    // Load templates
    const templateKeys = [
      'template:dnd_character', 'template:dnd_combat', 'template:dnd_npc',
      'template:dnd_description', 'template:dnd_rules', 'template:dnd_loot',
      'template:dnd_rest', 'template:dnd_social',
    ];
    const templates: Record<string, string> = {};
    const templateResults = await Promise.all(templateKeys.map(k => env.KV.get(k)));
    for (let i = 0; i < templateKeys.length; i++) {
      const key = templateKeys[i].replace('template:', '');
      if (templateResults[i]) templates[key] = templateResults[i];
    }

    return { personality, rules, theme, templates };
  } catch (error) {
    console.error('Failed to load DMlog config from KV:', error);
    return getDefaultConfig();
  }
}

/**
 * Get the default system prompt for DMlog.ai.
 */
export async function getSystemPrompt(env: Env): Promise<string> {
  const config = await loadDMLogConfig(env);
  return config.personality || getDefaultConfig().personality;
}

/**
 * Get routing rules for DMlog.ai commands.
 */
export async function getRoutingRules(env: Env): Promise<any[]> {
  const config = await loadDMLogConfig(env);
  return config.rules;
}

/**
 * Get theme CSS for DMlog.ai.
 */
export async function getThemeCSS(env: Env): Promise<string> {
  const config = await loadDMLogConfig(env);
  return config.theme;
}

/**
 * Get template by key.
 */
export async function getTemplate(key: string, env: Env): Promise<string | null> {
  const val = await env.KV.get(`template:${key}`);
  return val;
}

/**
 * Default fallback configuration.
 */
function getDefaultConfig(): DMLogConfig {
  return {
    personality: `# DMlog.ai System Prompt

You are DMlog.ai — an experienced Dungeon Master assistant for D&D 5e. 
Help with character creation, combat tracking, rules lookups, and immersive descriptions. 
Be theatrical but clear, rules-aware but flexible. Remember campaign context via the LOG.`,
    rules: [],
    theme: `/* DMlog.ai Theme - Fallback */
body.dm-theme {
  background-color: #1a0f0a;
  color: #f5f1e6;
  font-family: 'Crimson Text', serif;
}`,
    templates: {}
  };
}
