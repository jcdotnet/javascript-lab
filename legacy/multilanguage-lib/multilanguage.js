/*
 * MULTILANGUAGE JAVASCRIPT LIBRARY  
 *
 * We have an array called "strings" that store the texts and their translations in each language. For each text will give them a value to the key "text" so we can reference them 
 * and key for each language defined. Note that you can add as many languages as you need and name them as you like. This would be an example for an English/Spanish website.
 *
 * We have also an "errors" array so that we can translate the HTML validation errors. In this case the error values are provided and we only have to set the text for every defined language.
 *
 * Once you are familiar with these two arrays you need to follow these five steps: 
 *
 * STEP 1) Add a reference of this library to your project: 
 * STEP 2) Add the texts you want to be translated into the "strings" and "errors" array. 
 * STEP 3) Assign the initial language to the global variable "language". You can also get the browser's default language, checking and converting it if necessary. 
 * STEP 4) In your HTML add the attribute "data-text" to the element that contains the text to be translated. For example: data-text="welcome"
 * STEP 5) Call to the function ChangeLanguage passing one of the languages we've defined above as parameter to change the UI language without refreshing the page.
 *
 * It's that easy! Hope this library is useful!
 *
 * Copyright (c) 2015 by Jose Carlos Román Rubio (jcdotnet@hotmail.com)
 * Distributed under the MIT License. (See accompanying file LICENSE or copy at http://opensource.org/licenses/MIT)
 *
 * This file has been written in pure javascript so you don't have to reference any other libraries. 
 *
 */


/*
 * STEP 2: STRINGS ARRAY
 * 
 * We store here the texts. You can name the key languages as you like. I highly recommend using the locale in case you eventually want 
 * to use PHP (or another server-side language) to localize your site by setting the locale format for date, time, currency or numbers. 
 * Important! You MUST ALWAYS use the string language names you provide here. In this example they would be "en_GB" and "es_ES".  
 */
var strings = [
    {text: "welcome", en_GB: "Hello world", es_ES: "Hola mundo"},
    {text: "signup", en_GB: "Sign up", es_ES: "Regístrese"}
]

/*
 * STEP 2: ERRORS ARRAY
 * 
 * These are some HTML5 validation errors, set their texts as you like. DO NOT 
 * change the order: first must be "required", second "invalid-field", and so on  
 */

var errors = [
    {error: "required", en_GB: "This field cannot be left blank", es_ES: "Completa este campo"},
    {error: "invalid-field", en_GB: "Enter a valid value", es_ES: "Introduzca un valor válido"}, 
    {error: "invalid-email", en_GB: "Enter a valid e-mail", es_ES: "Introduzca un e-mail válido"}, 
    {error: "email-at-required", en_GB: "The character \"@\" is required", es_ES: "E-mail inválido, falta el signo \"@\""},
    {error: "email-no-domain", en_GB: "Enter text after \"@\"", es_ES: "Introduzca un valor después del signo \"@\""}   
]

/*
 * Sets the user interface language at runtime to the language passed in
 * @param {type} lang, Important! This parameter must match exactly one of the
 * language names specified in the strings array  
 */
setLanguage = function(lang){
    localStorage.setItem("language", lang); 
    for (var i = 0; i < strings.length; i++) { 
        var elements = document.querySelectorAll("[data-text=" + strings[i].text + "]");      
        for (var j = 0; j < elements.length; j++) {
            var e = elements[j];
            if (e.getAttribute("data-text") !== "undefined") 
            {                     
                if (e.tagName.toLowerCase() === "textarea" || e.tagName.toLowerCase() === "input" && e.getAttribute("type") === "text"
                       || e.tagName.toLowerCase() === "input" && e.getAttribute("type") === "password" 
                       || e.tagName.toLowerCase() === "input" && e.getAttribute("type") === "email")                   
                    e.setAttribute("placeholder", strings[i][lang]);
                else if (e.tagName.toLowerCase() === "img")
                {
                    e.setAttribute("alt", strings[i][lang]);
                    e.setAttribute("title", strings[i][lang]);
                }
                else if (e.tagName.toLowerCase() === "area")
                    e.setAttribute("alt", strings[i][lang]);
                else if (e.tagName.toLowerCase() === "abbr")  
                    e.setAttribute("title", strings[i][lang]);  
                else if (e.tagName.toLowerCase() === "input" && e.getAttribute("type") === "radio" || e.tagName.toLowerCase() === "input" && e.getAttribute("type") === "checkbox")
                    continue;                          
                else if (e.tagName.toLowerCase() === "input")
                    e.value = strings[i][lang];                         
                else 
                    e.innerHTML = strings[i][lang]; 
            }       
        }
    };
    setInputErrors(lang);
};

setInputErrors = function(lang) 
{
    var elements = document.getElementsByTagName("input");
    for (var i = 0; i < elements.length; i++) {  
        elements[i].oninvalid = function(e) {
            if (e.target.value === '')             
                e.target.setCustomValidity(errors[0][lang]); 
            else if (e.target.getAttribute("type") === "email" && e.target.validity.typeMismatch)
            {
                var indexAt = e.target.value.indexOf("@");
                if (indexAt === -1)
                    e.target.setCustomValidity(errors[3][lang]); 
                else 
                {
                    if (e.target.value.substring(indexAt).length === 1)
                        e.target.setCustomValidity(errors[4][lang]);
                    else 
                        e.target.setCustomValidity(errors[2][lang]);
                }
            }
            else if (e.target.validity.typeMismatch)
                e.target.setCustomValidity(errors[1][lang]); 
            else 
                e.target.setCustomValidity('');   
        };
        elements[i].oninput = function(e) {
            e.target.setCustomValidity(''); 
        
        };
    }
};


/* 
 * The DOMContentLoaded event is fired when the document has been completely 
 * loaded and parsed. Since this event is not supported in Internet Explorer 8,
 * we are using the well known onreadyStageChange event instead 
 *
document.addEventListener("DOMContentLoaded", function(event) { 
     SetLanguage("en_GB"); 
});
*/

/*
 * Once the document has been loaded and parsed, we have to set the UI language
 * to one of the languages we are specified in the array strings declared below
 */
document.onreadystatechange = function () {
     if (document.readyState === "complete") {   
		/* 
		 * localstorage stores the language with no expiration date so that every time we 
		 * either access or refresh the page, the last language stored will be displayed
		 */ 
		if (localStorage.getItem("language") === "undefined" || localStorage.getItem("language") === null)
		{
			/*
			 * STEP 3: INITIAL LANGUAGE
			 * Enter the initial user interface language 
			 * Important! The string value must match exactly one of the language names 
			 * specified in the strings array
			 */
			localStorage.setItem("language", "en_GB");
		}  
        setLanguage(localStorage.language); 
   }
 };