const process = require('process');

const eventTypes = {
  PushEvent: (repo, payload, created_at) => {
    const { name } = repo;
    const { size, commits } = payload;
    const date = new Date(created_at);

    const outputLog = `* Pushed ${size} ${(size > 1) ? "commits" : "commit"} to ${name}\t${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    let commitLog = '';
    commits.forEach(commit => {
      const { message } = commit;
      commitLog += `\tcommit message : ${message}\n`;
    });
    console.log(outputLog);
    console.log(commitLog);
  },

  CreateEvent: (repo, payload, created_at) => {
    const { name } = repo;
    const { master_branch, description } = payload;
    const date = new Date(created_at);

    const outputLog = `* Created a new repository:\t${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n\tTitle:${name}\n\tMaster branch: ${master_branch}\n\tDescription: ${description}\n`;
    console.log(outputLog);
  },

  WatchEvent: (repo, payload, created_at) => {
    const { name } = repo;
    // const { action } = payload;
    const date = new Date(created_at);

    const outputLog = `* Starred a repository: ${name}\t${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n`;
    console.log(outputLog);
  },

  PublicEvent: (repo, payload, created_at) => {
    const { name } = repo;
    const date = new Date(created_at);
    if (Object.keys(payload).length === 0) {
      console.log(`* Public Event: Payload is empty.\t${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n\n\tRepository: ${name}`);
      return;
    }
    const { action } = payload;
    console.log(`* ${action} ${name}\t${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n`);
  },

  ForkEvent: (repo, payload, created_at) => {
    const { name } = repo;
    const { forkee } = payload;
    const date = new Date(created_at);

    const outputLog = `* Forked a repository from ${name}\t${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n`;
    console.log(outputLog);
  },

  IssueEvent: (repo, payload, created_at) => {
    const { name } = repo;
  },

  IssueCommentEvent: (repo, payload, created_at) => {
    const { name } = repo;
    let { action, issue } = payload;
    const date = new Date(created_at);
    const firstChar = action.charAt(0).toUpperCase();
    action = firstChar + action.slice(1);

    const outputLog = `* ${action} a comment on an issue in ${name}\t${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n\tlink: ${issue.html_url}\n`;
    console.log(outputLog);
  },
};

const main = async () => {
  const argument = process.argv.slice(2);
  // console.log(argument);
  if (argument.length != 1) {
    console.info("Usage: node app <github-username>");
    process.exit(0);
  }
  const username = argument[0];
  const apiURI = `https://api.github.com/users/${username}/events`;
  trackActivities(apiURI);
}

const populateData = async (uri) => {
  const response =  await fetch(uri);
  const data =  await response.json();
  return data;
}

const trackActivities = async (apiURI) => {
  let userActivities = await populateData(apiURI);
  const { message, status } = userActivities

  if (message === 'Not Found' || status === '404') {
    console.log('Github user does not exist.\n');
    process.exit(0);
  }

  if (Object.keys(userActivities).length === 0) {
    const username = apiURI.split('/')[4];
    console.log(`${username} haven't touch github for a while.\n`);
    process.exit(0);
  }

  userActivities.sort((a, b) => (Date.parse(a.created_at) - Date.parse(b.created_at)));
  // console.log(userActivities);

  userActivities.forEach(activity => {
    const { type, repo, payload, created_at } = activity;
    const fn = eventTypes[type];
    // console.log(fn);
    if (fn !== undefined)
      fn(repo, payload, created_at);
    else
      console.log(`${type} is not yet implemented.\n`);
  });
}

main();