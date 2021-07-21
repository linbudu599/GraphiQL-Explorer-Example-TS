export const FETCH_URL = "https://serve.onegraph.com/dynamic?app_id=c333eb5b-04b2-4709-9246-31e18db397e1"

export const FETCH_URL_LITE = "https://ice-apollo-server.hasura.app/v1/graphql"

export const FETCH_HEADERS = {
  Accept: "application/json",
  "content-type": "application/json",
  "x-hasura-admin-secret": "QOVSHKo5dVBvL5IZGC6oEuzgsip6xn5KhP45s9mO75XRCQ5ZiWTlEW5rn5MYAqas"
}

export const DEFAULT_QUERY = `# shift-option/alt-click on a query below to jump to it in the explorer
# option/alt-click on a field in the explorer to select all subfields
query npmPackage {
  npm {
    package(name: "onegraph-apollo-client") {
      name
      homepage
      downloads {
        lastMonth {
          count
        }
      }
    }
  }
}

query graphQLPackage {
  npm {
    package(name: "graphql") {
      name
      homepage
      downloads {
        lastMonth {
          count
        }
      }
    }
  }
}

fragment bundlephobiaInfo on BundlephobiaDependencyInfo {
  name
  size
  version
  history {
    dependencyCount
    size
    gzip
  }
}`;

export const DEFAULT_QUERY_LITE = `# shift-option/alt-click on a query below to jump to it in the explorer
# option/alt-click on a field in the explorer to select all subfields
query {
  todo_records {
    id
  }
}
`;
