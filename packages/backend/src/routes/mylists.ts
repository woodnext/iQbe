import express, { Router } from 'express';
import { db } from '@/database';
import dayjs from '@/plugins/day';
import Hashids from 'hashids';

const router: Router = express.Router();
const hashids = new Hashids(process.env.HASHIDS_SALT, 10, process.env.HASHIDS_ALPHABET);

router.get('/', async (req, res) => {
  const userId = req.userId;

  try {
    const _mylists = await db.selectFrom('mylists')
    .selectAll()
    .where('user_id', '=', userId)
    .execute();

    for (const m of _mylists) {
      if (!m.mid) {
        const mylistIds = m.id;

        const mid = hashids.encode(mylistIds);

        await db.transaction().execute(async (trx) => {
          trx
          .updateTable('mylists')
          .set({ mid: mid })
          .where('id', '=', m.id)
          .execute();
        });
      }
    }

    const mylists = await db.selectFrom('mylists')
    .selectAll()
    .where('user_id', '=', userId)
    .execute();
    
    res.status(200).send(mylists.map(({ id, ...others }) => others));
  } catch(e) {
    console.error(e)
  }
})

router.post('/', async (req, res) => {
  const listName = req.body.listName
  const userId = req.userId
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  if (!listName) {
    res.status(400).send('Undefined list name')
    return
  }
    
  try {
    await db.transaction().execute(async trx => {
      const mylistsId = await db.selectFrom('mylists').select('id').orderBy('id desc').limit(1).execute();
      const lastMylistId = mylistsId.length !== 0 ? mylistsId[0].id : 0;
      const mid = hashids.encode(lastMylistId + 1);

      const data = {
        user_id: userId,
        name: listName,
        created: now,
        attr: 100,
        mid,
      };

      const inserts = await trx
        .insertInto('mylists')
        .values(data)
        .execute();
      const newList = await trx
        .selectFrom('mylists')
        .select(['name', 'mid'])
        .where('name', '=', listName)
        .executeTakeFirstOrThrow();
      
      const message = `${inserts.length} new mylists saved (user: ${userId})`;
      
      res.status(201).send(newList);
      console.log(message);
    })
  } catch(e) {
    res.status(400).send('An Error Occured')
    console.error(e)
  }
})

router.put('/quiz', async (req, res) => {
  const quiz_id = req.body.quizId;
  const mid = req.body.mid;
  const registered = dayjs().format('YYYY-MM-DD HH:mm:ss');
  
  if (!quiz_id || !mid) {
    res.status(400).send('Undefined quiz id or mylist id');
    return;
  }

  try {
    const inserts =await db.transaction().execute(async trx => {
      const mylist_id = (await trx
        .selectFrom('mylists')
        .select('id')
        .where('mid', '=', mid)
        .executeTakeFirstOrThrow()
      ).id;

      const data = {
        quiz_id,
        mylist_id,
        registered
      };    

      return await trx
        .insertInto('mylists_quizzes')
        .values(data)
        .execute();
    });

    const message = `${inserts.length} new quizzes saved into mylist (mylist: ${mid})`;
    res.status(201).send(message);
  } catch(e) {
    res.status(400).send('An Error Occurd')
    console.error(e)
  }
})

router.put('/rename', async (req, res) => {
  const mid = req.body.mid
  const userId = req.userId
  const newName = req.body.newName

  if (!userId || !mid || !newName) {
    res.status(400).send(`Undefined user id or mylist id or mylist's name`)
    return
  }

  try {
    const newList = await db.transaction().execute(async trx => {
      await trx.updateTable('mylists')
      .set({ name: newName })
      .where('mid', '=', mid)
      .executeTakeFirst();

      return await trx.selectFrom('mylists')
      .select([ 'name', 'mid' ])
      .where('user_id', '=', userId)
      .execute();
    });

    res.status(200).send(newList)
  } catch(e) {
    res.status(400).send('An Error Occurd')
    console.error(e)
  }
})

router.delete('/quiz', async (req, res) => {
  const quizId = req.body.quizId
  const mid = req.body.mid

  try {
    await db.transaction().execute(async trx => {
      const mylsitId = (await trx.selectFrom('mylists')
      .select('id')
      .where('mid', '=', mid)
      .executeTakeFirstOrThrow())?.id

      const deletes = await trx.deleteFrom('mylists_quizzes')
      .where(({ and, eb }) => and([
        eb('mylist_id', '=', mylsitId),
        eb('quiz_id', '=', quizId)
      ]))
      .executeTakeFirst();
    });

    res.status(204).send();
  } catch(e) {
    res.status(400).send('An Error Occured')
    console.error(e)
  }
})

router.delete('/list', async (req, res) => {
  const mid = req.body.mid
  const userId = req.userId
  
  try {
    const allList = await db.transaction().execute(async trx => {
      await trx
      .deleteFrom('mylists')
      .where('mid', '=', mid)
      .executeTakeFirst();

      return await trx
      .selectFrom('mylists')
      .select([ 'name', 'mid' ])
      .where('user_id', '=', userId)
      .execute();
    });

    res.status(200).send(allList);
  }catch(e) {
    console.log(e)
    res.status(400).send('An Error Occured')
  }
})

module.exports = router