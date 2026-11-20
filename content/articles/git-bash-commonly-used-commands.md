---
title: The Git Bash Commands you Need to Know
slug: git-bash-commonly-used-commands
date: 2025-04-02
updated: 2025-06-25
author: max-rios
category: software-development
excerpt: "New to Git? Here's our cheat sheet for the basics, setup, and must-know commands like commit, branch, merge and start up with a simple GUI."
coverImage:
  src: /images/articles/git-bash-commonly-used-commands/cover.png
  alt: "Git Bash & GUI: Guide to Git Commands and Installation"
draft: false
seo:
  title: "Git Bash & GUI: Guide to Git Commands and Installation"
  description: "Git Guide: A complete guide to Git version control, Git Bash, GIT alternatives, GUI tools, installation, repository management, and essential Git commands."
  noindex: false
---

## What is Git?

Git is a distributed version control system that controls source code for software development. With Git, it is possible to track code changes efficiently.

## What are the advantages of using Git?

Before Git, there were several distributed control version systems. However, Git implemented a concept that maintains a copy of the entire local repository, history, changes, and version control.

Git provides features to manage synchronization to repositories that share history. The local copy makes it always available, even without a network connection. The synchronization capability makes it very powerful and flexible.

## What is Git Bash?

The Bash environment is a Windows command-line terminal. We remark Windows because Git emulates a Unix-style command line. Unix-based operating systems and Mac OS include this type of terminal.

Git still provides a Linux/Unix version and macOS as well.

### Is Git Bash the only way to use Git?

No. Several visual solutions provide Git capabilities, hiding the command's complexity. Many development environments have embedded capabilities or offer the same features as plugins.

The visual solution can include a visual tree representation or just menus with the most common operations. The way operations represent commands is very flexible. Some plugins or environments group more than one command into a single operation.

It is essential to understand that most plugins or environments only provide a small set of commands through a visual interface. The Git Bash command line is the only way to access all possible operations.

## Installing Git Bash in Windows

To install Git Bash in Windows, go to the official page and click the Windows option.

[https://git-scm.com/downloads](https://git-scm.com/downloads)

The GUI clients section (https://git-scm.com/downloads/guis) also lists the different GUI clients for other platforms. This section groups a comprehensive list of external tools recommended by Git.

Select the default options if you are unsure what options to choose when installing the software.

## Configuration commands

Configuration commands are generally the first commands to use for new installations. These commands prepare the environment to use Git. For advanced scenarios where developers have multiple accounts for multiple projects, it is possible to use the configuration commands several times at the folder level.

### **Set up your name**.

This command sets your display name. Remember that this name does not refer to security or login information.

```
git config --global user.name "<Your.full.name>"
```

You can also set up your name for a single repository. To achieve that, you must be inside the project folder in the terminal. Just remove the global option from the command.

```
git config user.name "<Your.full.name>"
```

### Set up your email

```
git config --global user.email "<youraddress@domain.com">
```

### Display all configuration options

This command is essential to verifying the configuration's correctness. It will display every configuration option. Most are rarely modified, but some are common in enterprise environments.

```
git config --list
```

In some common enterprise scenarios, HTTP and credential store options require modification.

![](/images/articles/git-bash-commonly-used-commands/684b2edd7e5361d65ee69b7d-git-bash-cover-2.png)

## Repository commands

### Initialize a repository

This command initializes a Git repository in the current local folder.

```
git init
```

### Clone an existing repository

This command retrieves a repository from a URL and stores it locally.

```
git clone <url>
```

Git supports protocols, and URLs might look different depending on the repository.

-   ssh://
-   git://
-   http\[s\]://
-   ftp\[s\]://

We recommend visiting the official document for the clone command (https://git-scm.com/docs/git-clone) for more complex scenarios.

### Check repository status

The status command displays all changes in the current repository branch.

```
git status
```

### Display branches

The display branches command shows a list of branches in the local version of the repository. Suppose anybody updates the server copy after we download the repository. In that case, those branches will not appear in the local version.

```
git branch
```

or

```
git branch --list
```

### Switch to another branch

A typical project contains more than one branch. This command switches to another branch.

```
git checkout [another_branch]
```

### Delete a branch

The delete branch command is uncommon, but if you need it, use the following command.

```
git branch -d [branch_name]
```

This command deletes the local branch. For more advanced cases, such as removing remote branches or eliminating branches with existing changes, we suggest you read the documentation.

## Commit commands

### Add files

The add files command lets developers control files to add to a commit. Suppose we modify several files in our project; we can commit all of them at once with the following command:,

```
git add .
```

We can specify one file at a time, adding the file name at the end:

```
git add [filename_including_path]
```

Git also supports a list of files separated by commas:

```
git add [filename1],[filename2],[filename3]
```

Git allows the use of wildcards to commit similar files together:

```
git add *.txt
```

### Remove files from commit

The RM command removes a file from committing to a repository. This command does not modify the file in any way; it excludes it from the commit to the repository.

```
git rm --cached <filename_including_path>
```

### Commit files

When we add files to a commit, Git adds them to the 'staging section.' Once developers are ready to publish them, the commit command indicates that Git should save them in the repository.

```
git commit
```

The most common way to commit is by indicating a message for the changes. For example, let's assume we modified different files to fix a bug; the command will look like this:

```
git commit -m "Bug A fixed"
```

### Show differences

The diff command shows the differences between the last commit and the current repository status.

```
git diff
```

Git displays a list of changes, additions, and files removed.

## Stash and Pop commands

### Stash command

We train our teams in Git, and one of the most critical functions we know from experience is Stashing and Restoring changes. Git does not allow you to switch branches unless you commit changes.

It is common to have work in progress that you must set aside while conducting other work. Another case to save state is if you have changes in your local environment that you don't want to push to the repository. For example, you add some files for testing purposes or to override a configuration, and you want to preserve those changes before switching to another branch.

To stash your current changes, use the following command:

```
git stash
```

After running the command Git, reset the status to the last clean state before any changes and keep those changes in a separate place.

To restore the changes to the current branch, use the following command

```
git stash pop
```

If you want to see what is in the stash area, use the command:

```
git stash show
```

You can also delete all the entries in the stash area with the following command:

```
git stash clear
```

#### Stash command considerations

We suggest spending time using stash commands to understand how they work. It is one of the most influential and valuable commands but takes time to master.

We observed developers stashing current changes to continue working on the current or another branch. Suppose a developer modifies any files stashed and tries to pop the changes. In that case, the operation leads to conflicts that are not always simple to fix.

## Advanced commands

Below is a simple list of advanced commands. These operations are complex to learn, and entire articles cover a small portion of each command.

### Merge command

Merge a branch into the current branch.

```
git merge [branch_you_want_to_merge]
```

### Erase commits command

Reset changes to a specific commit

```
git reset [commit_reference]
```

Reset changes to the HEAD (soft)

```
git reset --soft HEAD^
```

The reset command is very complex and admits different options to reset the current state to specific commits and heads and even force the elimination of committed files. We recommend reading the documentation and understanding the consequences of forcing resets or reset changes to a particular commit. If you are unsure how it works, this command can cause you to lose essential changes.
