import Search from './models/Search';
import * as searchView from './views/searchView'
import * as recipeView from './views/recipeView'
import * as listView from './views/listView'
import * as likesView from './views/likesView'
import {elements, renderLoader, clearLoader} from './views/base';
import Recipe  from './models/Recipe';
import List  from './models/List';
import Likes from './models/Likes';

const state = {};
window.state = state;

//Search Controller
const controlSearch = async () => {
    const query = searchView.getInput();

    if(query){
        state.search = new Search(query);

        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try{
            await state.search.getResults();

            clearLoader();
            searchView.renderResults(state.search.result);
        }
        catch(err){
            console.log(err);
            clearLoader();
        }

    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if(btn){
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);

    }
});

//Recipe Controller

const controlRecipe = async () => {
    //Get id from url
    const id = window.location.hash.replace('#', '');
    console.log(id);

    if(id){
        //Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //Create new recipe Object
        state.recipe = new Recipe(id);

        try{
            //Get recipe data and parseIngredients
            await state.recipe.getRecipe();

            state.recipe.parseIngredients();

            //Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();

            //Render recipe
            clearLoader();
            let f = 0;
            state.likes.likes.forEach((el) => {
                if(el.id == id) {
                    f = 1;
                }
            });
            recipeView.renderRecipe(
                state.recipe, 
                f
                //state.likes.isLiked(id)
            );
        }
        catch(err){
            console.log(err);
        }
    }
}


['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

//List Controller
const controlList = () => {
    //Create a new list if there is none yet
    if (!state.list) state.list = new List();

    //Add each ingredient to the list and user interface
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}

//Testing
//state.likes = new Likes();

const controlLike = () => {
    if(!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    //User has not liked the recipe
    if(!state.likes.isLiked(currentID)){
        //Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );

        //Toggle the button
        likesView.toggleLikeBtn(true);

        //Add the like to UI
        likesView.renderLike(newLike);
    }
    //User has not liked the recipe
    else{
        //Remove like to the state
        state.likes.deleteLike(currentID);

        //Toggle the button
        likesView.toggleLikeBtn(false);


        //Remove the like from UI
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
}

//Restore liked recipes when page reloads
window.addEventListener('load', () => {
    state.likes = new Likes();
    state.likes.readStorage();
    //Toggle button
    likesView.toggleLikeMenu(state.likes.getNumLikes());
    //Render
    state.likes.likes.forEach(like => likesView.renderLike(like));
});



//Handle delete and update list
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //Handle the delete button
    if(e.target.matches('.shopping__description *')){
        //Delete from state
        state.list.deleteItem(id);

        //Delete from UI
        listView.deleteItem(id);
    }
    //Handle count update
    else if(e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});

//Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *')){
        //Decrease button in clicked
        if(state.recipe.servings > 1){
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    }
    else if(e.target.matches('.btn-increase, .btn-increase *')){
        //Increase button in clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    }
    else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        //Add ingredients to the shopping list
        controlList();
    }
    else if(e.target.matches('.recipe__love, .recipe__love *')){
        //Like controller
        controlLike();
    }
});

window.l = new List();
