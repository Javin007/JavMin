# Javin's Minifier v1.0.1
## Purpose: 
I needed a very simple minifier on a closed network, and did not have the option of installing NodeJS, or any other files (such as Google's Closure Library).  The minifier didn't need to do any transpiling, just simple minification, and I couldn't find anything out there that fit the bill, so I wrote this one.

## Function: 
This minifier is likely not the "best" way to go about it, but hey, it's functional.  And I've not taken the time to do ANY optimization, so no doubt it could be faster, as well.  For what I need it for, it works.  There are some known issues to keep an eye out for, though: 

    1.) I never use multiple variable declarations on the same line (eg: var a,b,c) so when it comes across these, it will only minify/obfuscate the first variable it finds (in this case, "a").  
    2.) It does very little code cleanup.  It does not remove many of the extra semicolons, and it doesn't add semicolons if they're missing.  Run your code through JSLint or something to make sure it's clean before trying to use the minifier then saying it's "busted".  
    3.) I think the regular expressions detection is a little hairy.  Particularly complex RegEx MAY break it, or it may break the RegEx.  I've not personally run into it yet, but you never know. 
    
So that's what it *doesn't* do.  What it *does* do is put all of your code on a single line, remove as much whitespace as it can, and obfuscate variable names down to one or two characters (more for size purposes, not obfuscation purposes).  It can remove the occasional extra semicolon, but not much else.  It will also do basic minification for CSS (use a "true" flag on the minify call).

Feel free to suggest better ways to do things if you're interested.

## Usage: 
Setup is simple.  In the main page (often index.html) simply add the script to the page:

```javascript
        <script src = "js/JavMin.js"></script>
```
    
To minify any code string, pass the string to the "minify" function in the "ph" (Peculair Habit) namespace:  

```javascript
        <script>
            ph.minify(strCode, true)
        </script>
```
The "true" says that you're minifying CSS.
That's pretty much it.  Not very fancy.
