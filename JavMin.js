/*-------------------------------------------------------------------------------------
Title: JavMin
Version: 1.0.2
Author: Javin
Address: javin@javin-inc.com

A very simple Javascript minifier.  This will obfuscate variable names (only to reduce
file size) and remove whitespace only.  It currently misses variables after the first one
when they're called like so:  
    var foo, bar, meh;
    
This does not break the code, but reduces the "shrink" factor.  
-------------------------------------------------------------------------------------*/

//Declare "ph" namespace.
var ph = ph || {};

//Add the minify function if it doesn't already exist.
ph.minify = ph.minify || function(code, isCSS){
	//We only swap out the parameter vars with declared variables here to save on a few bites when minified.
	var strCode = code;
	var css = isCss;
	
	//Placeholder to be used throughout.
	var strPlaceholder = String.fromCharCode(220);
	var strEscapedChar = String.fromCharCode(221);
	var strSuffix = String.fromCharCode(219);
	var strBlockStart = String.fromCharCode(222);
	var strBlockEnd = String.fromCharCode(223);
	var strUniqueVar = "Javin'sUniqueVarJ";
	
	//All characters that could be at the "end" of a "var" declaration.
	var strOps = [",","=",".",";"," in "];

	//All characters that should be "escaped" so as not to cause issues.
	var strEscapedChars = ["\\", "\"", "/","'"];
	
	//Simple function that continues to loop as long as it finds something to replace.
	var replaceAll = function(strString, strFind, strReplace) {
		//For as long as we're still finding it in the string...
		while (strString.indexOf(strFind) > -1) {
			//Replace it.
			strString = strString.replace(strFind,strReplace);
		}
		return strString;
	};
	
	var getBlock = function(strValue) {
		//To find a block, you have to start by finding where the block ENDS.
		var intEnd = strValue.indexOf("}") + 1;
		//Now go BACK from that spot to find the block.
		var intStart = strValue.lastIndexOf("{", intEnd);
		return strValue.substring(intStart, intEnd);
	};

	//Returns an array of declared variables. Note that currently this will only return those that 
	//are declared first.  So if multiple vars are declared on a single line (var a,b,c;) then only 
	//the first (a) will be minified.
	var getVars = function(strValue) {
		var strFoundVars = [];
		var intFoundVars = 0;
		
		//TODO: Find a way to find multiple vars on a single line.
		
		//First, find all variable declarations.
		var strVarDec = strValue.match(/var (.*?)( in |;|\=|,)/g);
		
		if (strVarDec == null) return;
		
		for (var i = 0; i < strVarDec.length; i++) {
			//Find the "operator" that's closest to the "start" of the declaration.			
			var intIndex = strVarDec[i].length;
			for (var a = 0; a < strOps.length; a++) {
				var intFound = strVarDec[i].indexOf(strOps[a]);
				if ((intFound > -1) && (intFound < intIndex)) intIndex = intFound;	
			}

			//Trim off the 'var' prefix, and the part after the "found" operator, and you should be left with the variable.
			var strVar = strVarDec[i].substr(4, intIndex - 4);
			
			//Make sure it's not already in the array of variables...
			if (strFoundVars.indexOf(strVar) == -1) {
				//Then add it.
				strFoundVars[intFoundVars] = strVar;
				intFoundVars++;
			}
						
		}
		
		return strFoundVars;
	};

	//Returns the variable at the "intNum" value.  0 = a, 1 = A, etc.  Two character vars after 52.   
	//This means it can only do 2,704 unique variables.  If you have more than that in a script, 
	//you're doing something wrong.
	var getVar = function(intNum) {		
		var strVars = ["a","A","b","B","c","C","d","D","e","E","f","F","g","G","h","H","i","I","j","J","k","K","l","L","m","M","n","N","o","O","p","P","q","Q","r","R","s","S","t","T","u","U","v","V","w","W","x","X","y","Y","z","Z"];
		if (intNum < 52) return strVars[intNum];
		return strVars[Math.floor(intNum / strVars.length) - 1] + strVars[intNum % strVars.length];
	};
	
				
	//Finds vars within a block scope and renames them to a simple name.
	var scrubVars = function(strValue) {

		//Track all vars found within blocks.
		var strVarList = [];
		
		//Loop through every block found. Inner blocks will be handled first.
		var strBlock = getBlock(strValue);
		while (strBlock != "") {
			var strNewVars = getVars(strBlock);
			if (strNewVars != null) {
				//Step through the vars found.
				for (var i = 0; i < strNewVars.length; i++) {
					//If they aren't blank, then...
					strNewVars[i] = strNewVars[i].trim();
					if (strNewVars[i] != "") {
						
						//If they're not already on the list, add them.
						if (strVarList.indexOf(strNewVars[i]) == -1) strVarList.push(strNewVars[i]);
					}
				}	
			}
			
			//Check the block for any functions [function varName(arg1, arg2)], and grab those parameter variables as well.
			var re = new RegExp("function(\\(([^\)]+)\\)|([^\)]+)\\(([^\)]+)\\)|([^\)]+)\\(\\))", "g");

			//Loops through found functions, and adds them to the var list.
			var strRet = strBlock.match(re);
			if (strRet != null) {
				for (var i = 0; i < strRet.length; i++) {
					strRet[i] = strRet[i].substr(0, strRet[i].length-1);
					var intIndex = strRet[i].indexOf("(") + 1;
					//see if there's a function name.
					var strTemp = strRet[i].substr(9, intIndex-10).trim();
					if (strTemp != "") {
						//If so, add that too.
						strVarList.push(strTemp);
					}
					
					var strSplit = strRet[i].substr(intIndex).split(",");
					for (var a = 0; a < strSplit.length; a++) {
						strSplit[a] = strSplit[a].trim();
						if (strSplit[a] != "") {
							if (strVarList.indexOf(strSplit[a]) == -1) strVarList.push(strSplit[a]);
						}
					}
				}
			}
			
			//Remove the block brackets and replace them with a placeholder so the next block can be found.
			var strNewBlock = strBlock;
			if (strNewBlock.substr(0,1) == "{") strNewBlock = strBlockStart + strNewBlock.substr(1);
			if (strNewBlock.substr(strNewBlock.length-1,1) == "}") strNewBlock = strNewBlock.substr(0, strNewBlock.length - 1) + strBlockEnd;
			strValue = strValue.replace(strBlock, strNewBlock);
			strBlock = getBlock(strValue);
		}
		

		
		//Once we're here, all vars in all blocks should be found, so set the block start/ends back.
		strValue = replaceAll(strValue, strBlockStart, "{");
		strValue = replaceAll(strValue, strBlockEnd, "}");
		
		//Now it's time to loop through all the blocks again and replace all of the vars that were 
		//previously found with much shorter versions.  For starters, we use placeholders to make sure
		//we don't accidentally use a variable that's used elsewhere.
		var strBlock = getBlock(strValue);
		while (strBlock != "") {
			var strNewBlock = strBlock;
			for (var i = 0; i < strVarList.length; i++) {
				//"Replace all word blocks (
				var re = new RegExp("(?!\\.)([^a-zA-Z\\d_]|^)" + strVarList[i] + "[^a-zA-Z\\d_]", "gm");
				//Loop through the matches.
				var strFound = strNewBlock.match(re);
				if (strFound != null) {
					for (var a = 0; a < strFound.length; a++) {
						//Grab escape prefix/suffix.
						var strCharPre = strFound[a].substr(0,1);
						var strCharSuff = strFound[a].substr(strFound[a].length-1, 1);
						//Strip them from the word. 
						var strFoundEsc = strFound[a].substr(1);
						strFoundEsc = strFoundEsc.substr(0, strFoundEsc.length-1);
						//Now return the prefix/suffix as escaped characters.
						strFoundEsc = "\\" + strCharPre + strFoundEsc + "\\" + strCharSuff;
						//Use it as a RegExp to find and replace the found names.
						re = new RegExp(strFoundEsc, "g");
						//Now do the find and replace with a temporary placeholder, but be sure to put the prefix and suffix back.
						strNewBlock = strNewBlock.replace(re, strCharPre + strUniqueVar + i + "J" + strCharSuff);
					}
				}
			}
			//As before, when done with a "block", remove the brackets temporarily so the next block can be found.
			if (strNewBlock.substr(0,1) == "{") strNewBlock = strBlockStart + strNewBlock.substr(1);
			if (strNewBlock.substr(strNewBlock.length-1,1) == "}") strNewBlock = strNewBlock.substr(0, strNewBlock.length - 1) + strBlockEnd;
			strValue = strValue.replace(strBlock, strNewBlock);
			strBlock = getBlock(strValue);			
		}
		
		//Once again, set the block start/ends back.
		strValue = replaceAll(strValue, strBlockStart, "{");
		strValue = replaceAll(strValue, strBlockEnd, "}");
		
		//Finally, replace all the placeholders with minified variables.
		for (var i = 0; i < strVarList.length; i++) {
			var re = new RegExp("\\b" + strUniqueVar+i+"J" + "\\b", "gm");
			strValue = strValue.replace(re, getVar(i));
		}
		
		return strValue;
	};

	
	//Replace all quote/regexp blocks with a placeholder.	
	var strPlaceholderValue = [];
	var intPlaceholderCount = 0;	
	
	var cleanLine = function(strLine) {
		//remove leading and trailing white space.
		strLine = strLine.trim();
		
		//If empty, bail.
		if (strLine == "") return "";
		
		//Check to see if it's a comment, if so, return nothing.
		if(strLine.substring(0,2) == "//") return "";

		//Find and flag all escaped characters in the line.
		for (var i = 0; i < strEscapedChars.length; i++) {
			strLine = replaceAll(strLine, "\\" + strEscapedChars[i], strEscapedChar + i + strSuffix);
		}
		
		//Regular expression to return quote block contents.
		var strRet = strLine.match(/("(.*?)"|'(.*?)')/g);
		
		//If quote blocks are found:
		if (strRet != null) {
			
			//Loop through all found quote blocks, and replace them with a placeholder.
			for (var i = 0; i < strRet.length; i++) {
				strPlaceholderValue[intPlaceholderCount] = strRet[i];
				strLine = strLine.replace(strRet[i], strPlaceholder + intPlaceholderCount + strSuffix);
				intPlaceholderCount++;
			}
	
		}
		
		if (!css) {
			//If at this point, we find two forward slashes, we're not sure if it's RegEx, or an inline comment,
			//so add an extra semicolon just to be safe.
			if (strLine.indexOf("//") > -1) {
				if (strLine.substr(strLine.length-1, 1) != ";") strLine = strLine + ";";
			}
		} else {
			//If it's CSS, we'll add a trailing space if there's no semicolon to make sure it doesn't break when things are put on multiple lines.
			if (strLine.substr(strLine.length-1, 1) != ";") strLine = strLine + " ";
		}
		
		//Return the finished product with a space padding the end, just to be safe.
		return strLine + " ";
	};

	//Separate along each "line"
	var strLines = strCode.split("\n");
	
	//Reset strCode to nothing.  (It's now contained in strLines as an array).
	strCode = "";
	
	//Step through each line and clean it (basically just removes comments and blank lines, and flags escaped chars.);
	for (var i = 0; i < strLines.length; i++) {
		strCode += cleanLine(strLines[i]);
	}

	//Find and replace regular expressions with placeholders.
	var strRet = strCode.match(/(\/(.*?)\/)([igm]*)/g);
	
	var intIndex;
	
	//If RegExp blocks are found:
	if (strRet != null) {
		//Loop through all found blocks, and replace them with a placeholder.
		for (var i = 0; i < strRet.length; i++) {
			
			//First, to make sure it IS a regular expression:
			//Grab the first non-white space character in front of it.
			intIndex = strCode.indexOf(strRet[i]) - 1;
			var strToken = strCode.substr(intIndex, 1);
			while ((strToken == " ") && (intIndex >= 0)) {				
				intIndex --;
				strToken = strCode.substr(intIndex, 1);
			}
			
			//If it starts with "," "=" or "(" it's likely a RegExp.
			if ((strToken == ",") || (strToken == "=") || (strToken == "(")) {
				strPlaceholderValue[intPlaceholderCount] = strRet[i];
				strCode = replaceAll(strCode, strRet[i], strPlaceholder + intPlaceholderCount + strSuffix);
				intPlaceholderCount++;					
			}
		}
	}

	
	//Remove any block comments. (/* */)
	strCode = strCode.replace(/\/\*(.*?)\*\//g, "");
	
	//Now start removing extras.
	
	//Replace any double spacing found with single spacing.
	strCode = replaceAll(strCode, "  ", " ");
	
	//None of these things need spaces on either side of them. 
	var strOperators = [];
	strOperators = ["[", "]", "{", "}", "(", ")", "=", "+", "-", "*", "/", "%", "^", "<", ">", "||", "&&", ",", ":", ";", "~", "!"];
	//CSS only gets a few of them.
	if (css) strOperators = ["{", "}", "=", "+", "-", "*", "/", "%", "^", "<", ">", ",", ":", ";", "~", "!"];
	for (var i = 0; i < strOperators.length; i++) {
		strCode = replaceAll(strCode, " " + strOperators[i], strOperators[i]);
		strCode = replaceAll(strCode, strOperators[i] + " ", strOperators[i]);
	}
		
	//CSS doesn't support inline comments.
	if (!css) {
	
		//Before removing any further semicolons, we need to get rid of any inline commenting.  
		//Must split the lines apart again to do that.
		strLines = strCode.split(";");
		//Loop through each line...
		for (var i = 0; i < strLines.length; i++) {
			var intIndex = strLines[i].indexOf("//");
			//If you find a double forward slash at this point, it's an inline comment.  Remove everything afterward.
			if (intIndex > -1) strLines[i] = strLines[i].substr(0, intIndex);
		}
		
		//Now bring them back together.
		strCode = strLines.join(";");		
	}
	
	//Get rid of multiple semicolons.
	strCode = replaceAll(strCode, ";;", ";");
	
	//Don't need semicolons after block starts.
	strCode = replaceAll(strCode, "{;", "{");	
	
	//Embedded block ends don't need semicolons.
	strCode = replaceAll(strCode, "};}", "}}");
	
	//Now scrub the vars, replacing them with minified names.
	if (!css) strCode = scrubVars(strCode);
	
	//Put quote blocks back where they were found, in reverse.
	for (var i = strPlaceholderValue.length-1; i >= 0 ; i--) {
		strCode = replaceAll(strCode, strPlaceholder + i + strSuffix, strPlaceholderValue[i]);
	}

	//Put back escaped chars.
	for (var i = 0; i < strEscapedChars.length; i++) {
		strCode = replaceAll(strCode, strEscapedChar + i + strSuffix, "\\" + strEscapedChars[i]);
	}
	
	//Don't need the trailing semicolon.
	if (strCode.substring(strCode.length-1) == ";") strCode = strCode.substring(0, strCode.length-1);
	
	//Return the result 
	return strCode;
	
};
