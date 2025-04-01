// src/services/activity-log.js
export class ActivityLogService {
  constructor() {
    this.listName = 'UserActivities';
  }

  // רישום פעולת משתמש
  async logActivity(action, itemPath, details = {}) {
    try {
      const currentUser = _spPageContextInfo.userDisplayName;
      const timestamp = new Date().toISOString();

      const payload = {
        __metadata: { type: 'SP.Data.UserActivitiesListItem' },
        Title: action,
        UserName: currentUser,
        ItemPath: itemPath,
        ActivityTimestamp: timestamp,
        ActivityDetails: JSON.stringify(details)
      };

      // קבלת digest value
      const digestResponse = await fetch(`${_spPageContextInfo.webAbsoluteUrl}/_api/contextinfo`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose'
        }
      });

      const digestData = await digestResponse.json();
      const formDigestValue = digestData.d.GetContextWebInformation.FormDigestValue;

      // הוספת רשומה לרשימת הפעילויות
      await fetch(`${_spPageContextInfo.webAbsoluteUrl}/_api/web/lists/getbytitle('${this.listName}')/items`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': formDigestValue
        },
        body: JSON.stringify(payload)
      });

      return true;
    } catch (error) {
      console.error('Error logging activity:', error);
      return false;
    }
  }

  // קבלת היסטוריית פעילות
  async getActivityHistory(limit = 100) {
    try {
      const response = await fetch(
        `${_spPageContextInfo.webAbsoluteUrl}/_api/web/lists/getbytitle('${this.listName}')/items?$top=${limit}&$orderby=ActivityTimestamp desc`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json;odata=verbose'
          }
        }
      );

      const data = await response.json();
      return data.d.results.map(item => ({
        id: item.Id,
        action: item.Title,
        user: item.UserName,
        path: item.ItemPath,
        timestamp: new Date(item.ActivityTimestamp),
        details: JSON.parse(item.ActivityDetails || '{}')
      }));
    } catch (error) {
      console.error('Error getting activity history:', error);
      return [];
    }
  }
}

export const activityLogService = new ActivityLogService();