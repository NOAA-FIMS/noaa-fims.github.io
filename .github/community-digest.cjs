const fs = require("node:fs");
const crypto = require("node:crypto");

module.exports = async ({ github, core }) => {
  const end = new Date();
  const since = new Date(end.getTime() - 7 * 86400000).toISOString();
  const until = end.toISOString();
  const date = until.slice(0, 10);
  const repos = process.env.DIGEST_REPOSITORIES.split(",").map(s => s.trim());

  const memoryPath = ".github/digest-memory.json";
  const memory = fs.existsSync(memoryPath)
    ? JSON.parse(fs.readFileSync(memoryPath, "utf8"))
    : { stories: {}, spotlights: {}, contributors: {} };
  memory.contributors ||= {};

  const notes = new Set();
  const stories = [];

  const human = a =>
    a?.__typename === "User" && !a.login.endsWith("[bot]");

  const recent = t =>
    Date.parse(t) >= Date.parse(since) && Date.parse(t) < end.getTime();

  const text = s => String(s)
    .replace(/[\r\n]+/g, " ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/[\\`*_[\]{}()!#|]/g, "\\$&");

  const author = "author { __typename login }";
  const page = "pageInfo { hasPreviousPage }";
  const commentFields = `id url createdAt ${author}`;

  const labels = `
    labels(first:100) {
      nodes { name }
      pageInfo { hasNextPage }
    }
  `;

  const comments = `
    comments(last:100) {
      nodes { ${commentFields} }
      ${page}
    }
  `;

  const issueFields = `
    id title url updatedAt createdAt
    ${author} ${labels} ${comments}
  `;

  const query = `
    query($ids:[ID!]!) {
      nodes(ids:$ids) {
        ... on Issue {
          ${issueFields}
          issueState: state
        }
        ... on PullRequest {
          ${issueFields}
          prState: state
          headRefName
          mergedAt
          reviews(last:100) {
            nodes { id url submittedAt state ${author} }
            ${page}
          }
          closingIssuesReferences(first:20) {
            nodes {
              url
              repository { nameWithOwner isPrivate }
            }
            pageInfo { hasNextPage }
          }
        }
        ... on Discussion {
          id title url updatedAt createdAt closed
          ${author} ${labels}
          discussionComments: comments(last:100) {
            nodes {
              ${commentFields}
              replies(last:100) {
                nodes { ${commentFields} }
                ${page}
              }
            }
            ${page}
          }
        }
      }
    }
  `;

  for (const fullName of repos) {
    const [owner, repo] = fullName.split("/");

    const { data: metadata } = await github.rest.repos.get({
      owner, repo,
    });

    if (metadata.private) {
      throw new Error(`Private repository refused: ${fullName}`);
    }

    const { data: items } = await github.rest.issues.listForRepo({
      owner,
      repo,
      state: "all",
      since,
      sort: "updated",
      direction: "desc",
      per_page: 100,
    });

    if (items.length === 100) {
      notes.add(`${fullName}: issue/PR retrieval capped at 100.`);
    }

    const ids = items
      .filter(i => recent(i.updated_at))
      .map(i => i.node_id);

    if (metadata.has_discussions) {
      const result = await github.graphql(`
        query($owner:String!, $repo:String!) {
          repository(owner:$owner, name:$repo) {
            discussions(
              first:100,
              orderBy:{field:UPDATED_AT, direction:DESC}
            ) {
              nodes { id updatedAt }
              pageInfo { hasNextPage }
            }
          }
        }
      `, { owner, repo });

      const discussions = result.repository.discussions;

      if (discussions.pageInfo.hasNextPage) {
        notes.add(`${fullName}: discussion retrieval capped at 100.`);
      }

      ids.push(...discussions.nodes
        .filter(d => recent(d.updatedAt))
        .map(d => d.id));
    }

    for (let offset = 0; offset < ids.length; offset += 10) {
      const result = await github.graphql(query, {
        ids: ids.slice(offset, offset + 10),
      });

      for (const n of result.nodes) {
        if (!n) throw new Error("A requested source could not be read.");

        const discussion = Object.hasOwn(n, "closed");
        const pr = Object.hasOwn(n, "mergedAt");

        // Avoid reporting editorial activity on the digest itself.
        if (pr && n.headRefName?.startsWith("automation/community-digest-")) {
          continue;
        }

        const thread = discussion ? n.discussionComments : n.comments;
        const events = [];
        let incomplete = thread.pageInfo.hasPreviousPage;

        if (n.labels.pageInfo.hasNextPage) {
          notes.add(`${n.url}: labels truncated.`);
        }

        for (const c of thread.nodes) {
          events.push({ ...c, kind: "comment" });

          if (c.replies) {
            incomplete ||= c.replies.pageInfo.hasPreviousPage;
            events.push(...c.replies.nodes.map(r => ({
              ...r, kind: "reply",
            })));
          }
        }

        if (pr) {
          incomplete ||= n.reviews.pageInfo.hasPreviousPage;

          events.push(...n.reviews.nodes
            .filter(r => r.state !== "PENDING")
            .map(r => ({
              ...r,
              createdAt: r.submittedAt,
              kind: "review",
            })));

          if (n.closingIssuesReferences.pageInfo.hasNextPage) {
            notes.add(`${n.url}: linked issues truncated.`);
          }
        }

        if (incomplete) {
          notes.add(
            `${n.url}: conversation history truncated; counts are lower bounds.`
          );
        }

        const allHuman = events.filter(e => human(e.author));
        const activity = allHuman.filter(e => recent(e.createdAt));
        const people = [...new Set(
          activity.map(e => e.author.login)
        )].sort();

        const status = n.mergedAt
          ? "merged"
          : discussion
            ? (n.closed ? "closed" : "open")
            : (pr ? n.prState : n.issueState).toLowerCase();

        const fingerprint = crypto.createHash("sha256")
          .update(JSON.stringify([
            status,
            n.mergedAt,
            n.title,
            n.labels.nodes.map(l => l.name).sort(),
            allHuman
              .map(e => [e.id, e.createdAt])
              .sort((a, b) => a[0].localeCompare(b[0])),
          ]))
          .digest("hex");

        const linked = pr
          ? n.closingIssuesReferences.nodes
            .filter(i =>
              !i.repository.isPrivate &&
              repos.includes(i.repository.nameWithOwner))
            .map(i => i.url)
          : [];

        stories.push({
          url: n.url,
          title: n.title,
          repository: fullName,
          author: human(n.author) ? n.author.login : null,
          kind: discussion ? "discussion" : pr ? "PR" : "issue",
          status,
          createdAt: n.createdAt,
          mergedAt: n.mergedAt,
          labels: n.labels.nodes.map(l => l.name),
          linked,
          activity,
          people,
          fingerprint,
          incomplete,
          waiting:
            status === "open" &&
            !incomplete &&
            human(n.author) &&
            !allHuman.some(e => e.author.login !== n.author.login),
        });
      }
    }

    const { data: releases } = await github.rest.repos.listReleases({
      owner, repo, per_page: 100,
    });

    if (releases.length === 100) {
      notes.add(`${fullName}: release retrieval capped at 100.`);
    }

    for (const r of releases.filter(r =>
      !r.draft && recent(r.published_at))) {
      stories.push({
        url: r.html_url,
        title: r.name || r.tag_name,
        repository: fullName,
        author: r.author?.type === "User" ? r.author.login : null,
        kind: "release",
        status: r.prerelease ? "prerelease" : "released",
        createdAt: r.published_at,
        publishedAt: r.published_at,
        labels: [],
        linked: [],
        activity: [],
        people: [],
        waiting: false,
        fingerprint: crypto.createHash("sha256")
          .update(JSON.stringify([
            r.id, r.tag_name, r.name, r.published_at, r.prerelease,
          ]))
          .digest("hex"),
      });
    }
  }

  const lines = [
    "---",
    `title: "Around FIMS - ${date}"`,
    `date: ${date}`,
    "categories: [community-digest]",
    "draft: true",
    "---",
    "",
    `Reporting window: ${since} to ${until} (UTC).`,
    "",
    "::: {.callout-warning}",
    "Editorial draft. Verify credit and add context before publication.",
    "No quotes, consensus, contributor profiles, or release availability are inferred.",
    ":::",
    "",
  ];

  const selected = new Set();

  const recentSpotlight = s => Boolean(
    s.author &&
    memory.spotlights[s.author] &&
    end - new Date(memory.spotlights[s.author]) < 28 * 86400000
  );

  const rank = (a, b) =>
    Number(recentSpotlight(a)) - Number(recentSpotlight(b)) ||
    b.people.length - a.people.length ||
    a.url.localeCompare(b.url);

  const changed = s =>
    memory.stories[s.url]?.fingerprint !== s.fingerprint;

  const feature = (
    heading, candidates, invitation, limit = 2, recognition = false
  ) => {
    lines.push(`## ${heading}`, "");

    const picks = candidates
      .filter(s => !selected.has(s.url))
      .sort(rank)
      .slice(0, limit);

    if (!picks.length) {
      lines.push(
        "_No eligible story found in this run's bounded sample._", ""
      );
    }

    for (const s of picks) {
      selected.add(s.url);

      lines.push(
        `### ${text(s.title)}`,
        "",
        `**Source:** [${text(s.repository)} ${s.kind}](${s.url}) — ${s.status}.`,
        ""
      );

      if (s.author) {
        lines.push(
          `${s.kind === "release" ? "Published" : "Opened"} by **${text(s.author)}**.`,
          ""
        );
      }

      if (s.kind !== "release") {
        lines.push(
          `During this window: ${s.activity.length}${s.incomplete ? "+" : ""} human comments, replies, or review submissions; ` +
          `${s.people.length}${s.incomplete ? "+" : ""} distinct participants.`,
          ""
        );
      }

      if (s.people.length) {
        lines.push(
          `Participants: ${s.people.map(text).join(", ")}.`, ""
        );
      }

      if (s.linked.length) {
        lines.push(
          `Linked issues: ${s.linked
            .map(u => {
              const m = u.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/(issues|pull)\/(\d+)$/);
              const label = m ? `${m[2]}#${m[4]}` : u;
              return `[${text(label)}](${u})`;
            })
            .join(", ")}.`,
          ""
        );
      }

      const previous = memory.stories[s.url];

      if (previous) {
        lines.push(
          `Previously selected on ${previous.lastFeatured}; state then: ${previous.status}.`,
          "Recorded activity, state, title, or editorial labels changed; explain the substantive development.",
          ""
        );
      }

      lines.push(
        "**Why it matters:** _Editor: connect the source to members' experience._",
        "",
        `**Join in:** ${invitation}`,
        ""
      );

      memory.stories[s.url] = {
        lastFeatured: date,
        status: s.status,
        fingerprint: s.fingerprint,
      };

      if (recognition && s.author) {
        memory.spotlights[s.author] = date;
      }
    }
  };

  const eligible = stories.filter(s =>
    changed(s) && (
      s.activity.length ||
      recent(s.createdAt) ||
      recent(s.mergedAt) ||
      s.labels.some(l =>
        ["digest-feature", "digest-approved"].includes(l))
    )
  );

  const regular = eligible.filter(s =>
    !s.labels.includes("digest-approved"));

  feature(
    "The story continues",
    regular.filter(s => memory.stories[s.url]),
    "Read the latest exchange and check which question or testing need remains open."
  );

  feature(
    "What we accomplished together",
    regular.filter(s =>
      !s.labels.includes("digest-feature") && (
        (s.status === "merged" && recent(s.mergedAt)) ||
        recent(s.publishedAt)
      )),
    "Check the source for usage and testing instructions; merged work is not necessarily released."
  );

  feature(
    "Thanks for moving us forward",
    regular.filter(s => s.labels.includes("digest-feature")),
    "Editor: credit a specific, evidenced act of teaching, testing, documentation, or constructive review.",
    2,
    true
  );

  feature(
    "A question looking for another voice",
    regular.filter(s => s.waiting),
    "If you have relevant experience, offer an example or a clarifying question in the source thread.",
    1
  );

  feature(
    "Your experience is needed",
    regular.filter(s =>
      s.status === "open" &&
      s.labels.some(l => [
        "help wanted",
        "good first issue",
        "needs-testing",
        "needs-feedback",
      ].includes(l))),
    "Read the maintainer's request and scope before offering to test, document, or give feedback."
  );

  feature(
    "From the community",
    eligible.filter(s => s.labels.includes("digest-approved")),
    "Editor: confirm the submitter's permission and retain their attribution.",
    1
  );

  feature(
    "A conversation worth joining",
    regular.filter(s => s.status === "open" && s.people.length >= 2),
    "Editor: identify the unresolved question and whose perspective would help.",
    1
  );

  // Identify new participants appearing in featured stories for the first time
  const featuredPeople = new Set();
  for (const s of stories.filter(s => selected.has(s.url))) {
    if (s.author) featuredPeople.add(s.author);
    for (const p of s.people) featuredPeople.add(p);
  }
  const firstTimers = [...featuredPeople]
    .filter(p => !memory.contributors[p])
    .sort();

  if (firstTimers.length) {
    lines.push(
      "## Welcome to our new contributors",
      "",
      `A warm welcome to **${firstTimers.map(text).join("**, **")}** for participating in discussions, code, or reviews across FIMS repositories during this period!`,
      "",
      "_Editor: verify individual welcomes and ensure attribution is accurate._",
      ""
    );
    for (const p of firstTimers) {
      memory.contributors[p] = date;
    }
  }

  lines.push(
    "## Next week's invitation",
    "",
    "_Editor: choose one concrete action above. Link directly to where members can participate._",
    "",
    "## Collection notes",
    "",
    `Repositories: ${repos.map(text).join(", ")}.`,
    "",
    "Only sources updated during the window are discovered; older unanswered questions may be missed.",
    "Counts exclude detected bots and include top-level comments, discussion replies, and submitted PR reviews;",
    "inline review comments, edits, reactions, and deleted activity are not counted.",
    "Participation is not evidence of agreement, helpfulness, or impact. No contribution leaderboard is produced.",
    "Closed issues are not assumed completed; merged PRs are not assumed released.",
    "Recognition favors authors not spotlighted in 28 days; editors must verify credit for all roles.",
    "Memory records reviewed selections only after the digest PR is merged; reconcile it with editorial deletions.",
    ...[...notes].map(n => `- ${text(n)}`),
    ""
  );

  for (const note of notes) core.warning(note);

  fs.mkdirSync("blog", { recursive: true });
  fs.mkdirSync(".github", { recursive: true });
  fs.mkdirSync("digest-evidence", { recursive: true });

  fs.writeFileSync(
    `blog/community-digest-${date}.qmd`,
    lines.join("\n")
  );

  fs.writeFileSync(
    memoryPath,
    JSON.stringify(memory, null, 2) + "\n"
  );

  fs.writeFileSync(
    "digest-evidence/activity.json",
    JSON.stringify({
      since,
      until,
      repositories: repos,
      notes: [...notes],
      selected: [...selected],
      stories,
    }, null, 2)
  );

  core.setOutput("date", date);
};