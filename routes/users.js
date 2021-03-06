"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureCorrectUserOrAdmin, ensureAdmin } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const userUpdateSchema = require("../schemas/userUpdate.json");
const Encounters = require("../models/encounters");

const router = express.Router();


/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: admin
 **/

router.get("/", ensureAdmin, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin, jobs }
 *   where jobs is { id, title, companyHandle, companyName, state }
 *
 * Authorization required: admin or same user-as-:username
 **/

router.get("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: admin or same-user-as-:username
 **/

router.patch("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: admin or same-user-as-:username
 **/

router.delete("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});


/** POST /[username]/encounter
 *
 * Returns { "encounter": {username, description, id}}
 *
 * */
router.post("/:username/encounter", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const { name, description, monsters } = req.body;
    let encounter = await Encounters.create( req.params.username, description, name );
    if( monsters ){
      encounter = await Encounters.putAllMonsters( encounter.id, monsters );
    }
    return res.status(201).json({ encounter });
  } catch (err) {
    return next(err);
  }
});

/** GET /[usernae]/encounter
 * 
 * Returns {"encounters": [id: [monster1...], ...]}
 */
router.get('/:username/encounter', ensureCorrectUserOrAdmin, async function (req, res, next){
  try{
    const encounters = await Encounters.getAll( req.params.username );
    return res.json({ encounters });
  } catch (err) {
    return next(err);
  }
})

/** GET /[username]/encounter/[id]
 * 
 * Returns { username, description, id, [monsters]}
 */
router.get("/:username/encounter/:id", ensureCorrectUserOrAdmin, async function (req, res, next){
    try {
      //TODO: Addin Json verification
        const encounter = await Encounters.get( req.params.id );
        return res.json({ encounter });
    } catch (err) {
        return next(err);
    }
});

/** PUT /[username]/encounter/[id]
 * 
 *  Returns { username, description, id, [monsters]}
 */
router.put("/:username/encounter/:id", ensureCorrectUserOrAdmin, async function (req, res, next ){
  try {
    //TODO: Addin Json verification
    const result = await Encounters.putAllMonsters( req.params.id, req.body );
    return res.json(result);
  } catch (err) {
      return next(err);
  }
});

/** DELETE /[username]/encounter/[id]
 * 
 * Returns { deleted: id}
 */ 
router.delete("/:username/encounter/:id", ensureCorrectUserOrAdmin, async function (req, res, next){
  try{
    const result = await Encounters.deleteEncounter( req.params.id );
    return res.json(result);
  }catch ( err ){
    return next(err);
  }
})

module.exports = router;