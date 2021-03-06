"use strict"

let Sequelize = require('sequelize');
require('sequelize-hierarchy')(Sequelize);
let db = require('./db');
let User = require('./User');
let Contractor = require('./Contractor');
let OrderModel = require('./Order');
let News = require('./News');
let GGroup = require('./GGroup');
let GoodsModel = require('./Goods')
//let async = require('async');

function getChilds(id, items) {
  let i = 0;
  let result = [];
  while (i < items.length) {
    if (items[i].parentId === id) {
      result.push(items[i]);
      items.splice(i, 1);
    } else {
      i++;
    }
  }
  return result;
}

function makeTree(result, items) {
  if (!items || !result) {
    return
  } else {
    result.forEach((item) => {
      let children = getChilds(item.id, items);
      if (children.length > 0) {
        item.children = children;
        makeTree(item.children, items);
      }
    })
  }
}


class DBCore  {
  //let userOrders = {};
  syncDB(force) {
    db.sync({force: force});
  }

  //задаем scope в зависимости от роли пользователя
  setUser(id, userType) {
    OrderModel.OrderPr.setUser(id, userType);
  }

  getOrders() {
    return OrderModel.OrderPr.findAll({
      attributes: Object.keys(OrderModel.OrderPr.attributes).concat([
            [Sequelize.literal('(SELECT contractor.name FROM contractor WHERE contractor.id = order_pr.contractorId)'), 'contractorName']
        ]),
      raw: true
    });
  }

  getOrderSpec(id, callback) {
    OrderModel.OrderPr.findById(id,  { include: [ {model: OrderModel.OrderSpec, as: 'OrderSpec'} ] })
                      .then((item) => {
                              if (item) {
                                callback(item.OrderSpec)
                              } else {
                                callback(undefined)
                              }
                            })
                      .catch((err) => {
                          callback(undefined, err)
                       });
 }

 getNewsByLastId(limit, lastId) {
   let attr = ['id', 'releaseDate', 'caption', 'text'].concat([[Sequelize.literal('if((news.fullText is null) or (length(trim(news.fullText)) = 0), 0, 1)'), 'isFullText']]);
   let conditions = {releaseDate: {$ne: null}};
   if (lastId) {
     conditions = {id: {$gt: lastId}, $and:{releaseDate: {$ne: null}}}
   }
  return News.findAll({
       attributes: attr,
       where: conditions,
       order: [['id', 'DESC']],
       limit: limit,
       offset: 0
     });
 }

 getNewsByOffset(limit, offset) {
   let attr = ['id', 'releaseDate', 'caption', 'text'].concat([[Sequelize.literal('if((news.fullText is null) or (length(trim(news.fullText)) = 0), 0, 1)'), 'isFullText']]);
   let conditions = {releaseDate: {$ne: null}};
   return News.findAll({
        attributes: attr,
        where: conditions,
        order: [['releaseDate', 'DESC']],
        limit: limit,
        offset: offset
      });
 }

 getNewsCnt() {
   return News.findOne({
    attributes: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'cnt']],
    where: {
      releaseDate: {
         $ne: null
      }
    }
   });
 }

 getNewsById(id, callback) {
   return News.findById(id, {
     attributes: ['id', 'releaseDate', 'caption', 'text', 'fullText'],
     raw: true
   }).then((item) => {
     callback(item);
   }).catch((error) => {
     callback(undefined, error);
   })
 }

 getGGroup(callback) {
   GGroup.findAll({
        attributes: ['id', 'parentId', 'name'].concat([
              [Sequelize.literal('(exists(select 1 from goods_groups gg where gg.parentId = goods_groups.id))'), 'togglable']
          ]),
        raw: true
      }).then(function(items) {
        //clone itemClassName
        let plain = {};
        items.forEach((item) => {
           plain[item.id] = Object.assign({}, item);
        });
        let items_ = items.map((item) => {
          return Object.assign({}, {id: item.id, parentId: item.parentId});
        })
        let tree = [];
        let i = 0;
        while (i < items_.length) {
          if (!items_[i].parentId) {
            tree.push(items_[i]);
            items_.splice(i, 1);
          } else {
            i++;
          }
        }
        makeTree(tree, items_);
        callback({tree:tree, plain: plain});
      }).catch((error) => {
        callback(undefined, error);
      });
 }

 getGoods(ggroup, limit, offset) {
   let orderBy = 'ORDER BY ga.name';
   let limitClause = '';
   if (limit) {
     limitClause = 'limit ' + limit;
   }
   if (offset) {
    limitClause = limitClause + ' offset ' + offset;
   }
   let filter = '';
   return db.query(
     'SELECT ga.id, ga.name as caption, ga.imgURL, ga.shortDescription, ga.goodsGroupId, ' +
     '       ga.promoId,  p.caption promoCaption, p.text promo, ' +
     '       ga.oldPrice, ga.price ' +
     '  FROM goods_view ga left join promo p on ga.promoId = p.id' +
     ' WHERE ga.goodsGroupId = :ggroup ' + filter + ' ' + orderBy + ' ' + limitClause,
     { replacements: { ggroup: ggroup}, type: Sequelize.QueryTypes.SELECT }
   );
 }

 getGoodsCnt(ggroup, callback) {
   let filter = '';
   db.query(
     'SELECT count(ga.id) cnt '+
     '  FROM goods_view ga left join promo p on ga.promoId = p.id' +
     ' WHERE ga.goodsGroupId = :ggroup ' + filter,
     { replacements: { ggroup: ggroup}, type: Sequelize.QueryTypes.SELECT }
   ).then((items) => {
     callback(items[0].cnt);
   }).catch((error) => {
     callback(undefined, error);
   })
 }

}


    /*OrderModel.OrderPr.findById(id,  { include: [ {model: OrderModel.OrderSpec, as: 'OrderSpec'} ] }).then(function(item) {
      callback(item.OrderSpec);
  });
}*/
  /*return OrderModel.OrderPr.findAll({
    where: {
    id: id
  },
     include: [ {model: OrderModel.OrderSpec, as: 'OrderSpec'} ]
  });
  }

}*/


let dbCore = new DBCore();
//dbCore.syncDB(true);
/*GGroup.bulkCreate([
  {id:31232, parentId:24608, name:'3.2.1.1 Оборудование ELUMATEC LV'},
  {id:31233, parentId:24608, name:'3.2.1.2 Оборудование URBAN LV'},
  {id:31234, parentId:24608, name:'3.2.1.3 Оборудование FIMTEC LV'},
  {id:31235, parentId:24608, name:'3.2.1.4 Оборудование Aluma LV'},
  {id:31236, parentId:24608, name:'3.2.1.5 Оборудование ROTOX LV'},
  {id:31237, parentId:24608, name:'3.2.1.6 Остальное производственное оборудование LV'},
  {id:38567, parentId:24608, name:'3.2.1.9  Оборудование для гибки профиля LV'},
  {id:24609, parentId:24596, name:'3.2.4 Рекламное LV'},
  {id:24610, parentId:24596, name:'3.2.3 Системы безопасности LV'},
  {id:24611, parentId:24596, name:'3.2.2 Сервисное, инструменты и офисный инвента LV'},
  {id:31225, parentId:24596, name:'3.2.5 Торговое LV'},
  {id:31226, parentId:24596, name:'3.2.6 Прочее LV'}


]);*/
/*dbCore.getGoodsCnt(24557).then(function(items) {

    console.log(items[0].cnt);
  });*/

/*dbCore.setUser(1, 0);
dbCore.getOrders().then(function(items) {
  console.log(items);
});*/
module.exports.dbCore = dbCore;
