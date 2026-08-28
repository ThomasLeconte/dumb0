export enum IpcRoutes {
    // App
    APP_CLOSE = 'app-close',
    APP_SET_TITLE = 'app-set-window-title',
    DATASOURCE_GET_ALL = 'datasource-get-all',
    // Datasources
    DATASOURCE_GET_BY_ID = 'datasource-get-by-id',
    DATASOURCE_GET_STATS = 'datasource-get-stats',
    DATASOURCE_CREATE = 'datasource-create',
    DATASOURCE_UPDATE = 'datasource-update',
    DATASOURCE_DELETE = 'datasource-delete',
    DATASOURCE_EXECUTE_QUERY = 'datasource-execute-query',
    DATASOURCE_GET_QUERY_HISTORY = 'datasource-get-query-history',
    DATASOURCE_DELETE_QUERY_HISTORY = 'datasource-delete-query-history',
    DATASOURCE_GET_SAVED_QUERIES = 'datasource-get-saved-queries',
    DATASOURCE_CREATE_SAVED_QUERY = 'datasource-create-saved-query',
    DATASOURCE_UPDATE_SAVED_QUERY = 'datasource-update-saved-query',
    DATASOURCE_DELETE_SAVED_QUERY = 'datasource-delete-saved-query',
    DATASOURCE_ASK_AI_QUERY = 'datasource-ask-ai-query',
    TABLES_GET_ALL = 'tables-get-all',
    TABLES_GET_STATS = 'tables-get-stats',

}
