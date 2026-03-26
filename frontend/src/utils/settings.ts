export interface CustomFieldDef {
  id: string;
  name: string;
  type: 'text' | 'dropdown';
  options?: string[]; // Comma separated list of options if dropdown
  includeInVision: boolean;
  includeInAgent: boolean;
}

export interface WidgetSettings {
  defaultTab: 'jules' | 'linear';
  customFields: CustomFieldDef[];
}

export interface SiteSettings {
  defaultRepo: string;
  defaultBranch: string;
  customFields: CustomFieldDef[];
}

export class SettingsManager {
  private static WIDGET_SETTINGS_KEY = 'fw_widget_settings';
  private static SITE_SETTINGS_PREFIX = 'fw_site_settings_';

  static getWidgetSettings(): WidgetSettings {
    try {
      const data = localStorage.getItem(this.WIDGET_SETTINGS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to parse widget settings', e);
    }
    return { defaultTab: 'jules', customFields: [] };
  }

  static saveWidgetSettings(settings: WidgetSettings) {
    try {
      localStorage.setItem(this.WIDGET_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save widget settings', e);
    }
  }

  static getSiteSettings(): SiteSettings {
    const cookieName = `${this.SITE_SETTINGS_PREFIX}${window.location.hostname}`;
    const match = document.cookie.match(new RegExp('(^| )' + cookieName + '=([^;]+)'));
    if (match) {
      try {
        const decoded = decodeURIComponent(match[2]);
        return JSON.parse(decoded);
      } catch (e) {
        console.error('Failed to parse site settings cookie', e);
      }
    }
    return { defaultRepo: '', defaultBranch: '', customFields: [] };
  }

  static saveSiteSettings(settings: SiteSettings) {
    const cookieName = `${this.SITE_SETTINGS_PREFIX}${window.location.hostname}`;
    const value = encodeURIComponent(JSON.stringify(settings));
    // 1 year expiration
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${cookieName}=${value}; max-age=${maxAge}; path=/; SameSite=Lax`;
  }
}
