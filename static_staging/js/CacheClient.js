/**
 * Client for retrieving and processing infectious disease data from the
 * database cache API.
 *
 * Angus Andrea Grieve-Smith, 2024
 *
 */
export default class CacheClient {
    fetchData(url, options={}, results=[]) {
        return new Promise((resolve, reject) => {
            fetch(url, options).then((res) => {
                if (res.status === 204) {
                    resolve(res);
                    return;
                } else if (res.status < 200 || res.status > 299) {
                    reject(res);
                    return;
                }

                res.json().then((resJson) => {
                    if (!Object.prototype.hasOwnProperty.call(
                        resJson,
                        "results"
                        )
                    ) {
                        resolve(resJson);
                        return;
                    }

                    results = results.concat(resJson.results);
                    if (resJson.next) {
                        this.fetchData(resJson.next, options, results).then(
                            resolve, reject
                        );
                    } else {
                       resolve(results);
                    }
                }, reject);
            }, reject);
        });

    }

}