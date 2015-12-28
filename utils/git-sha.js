var Git    = require("nodegit");
var GitSha = module.exports = {};


/**
 * Get the sha for the latest commit on the current branch.
 * @param {!Promise} promise The promise chain to forward.
 * @param {!String}  repo_path Path to the repo.
 * @returns {!Promise}
 *     A promise that resolves to the commit sha and the value returned
 *     by the given promise (which should be the archive name).
 */
GitSha.get_commit_sha = function get_commit_sha(promise, repo_path) {
  return promise.then(function(continuation) {
    return Git.Repository.open(repo_path).then(function(repo) {
      return repo;

    }).then(function(repo) {
      return repo.head().then(function(branch) {
        return repo.getReferenceCommit(branch);
      });

    }).then(function(commit) {
        continuation.sha = commit.sha();
        return continuation;
    });
  });
};


/**
 * Get the state of the repository workdir and index.
 * @param {!Promise} promise The promise chain to forward.
 * @param {!String}  repo_path Path to the repo.
 * @returns {!Promise}
 *     A promise that resolves to state info and the value returned
 *     by the given promise (which should be the archive name).
 */
GitSha.get_change_info = function get_change_info(promise, repo_path) {
  return promise.then(function(continuation) {
    return Git.Repository.open(repo_path).then(function(repo) {
      // Do not recurse into untracked directories.
      // It takes way too long for mostly irrelevant cases.
      return repo.getStatus({
        flags: Git.Status.OPT.INCLUDE_UNTRACKED
      });

    }).then(function(statuses) {
      var index = false;
      var work  = false;

      statuses.forEach(function(status) {
        index = index || status.inIndex();
        work  = work  || status.inWorkingTree();
      });

      continuation.index_changed = index;
      continuation.work_changed  = work;
      return continuation;
    });
  });
};
