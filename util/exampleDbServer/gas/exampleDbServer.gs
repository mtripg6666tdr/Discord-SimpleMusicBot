/*
 * Copyright 2021-2022 mtripg6666tdr
 * 
 * This file is part of mtripg6666tdr/Discord-SimpleMusicBot. 
 * (npm package name: discord-music-bot / repository url: https://github.com/mtripg6666tdr/Discord-SimpleMusicBot )
 * 
 * mtripg6666tdr/Discord-SimpleMusicBot is free software: you can redistribute it and/or modify it 
 * under the terms of the GNU General Public License as published by the Free Software Foundation, 
 * either version 3 of the License, or (at your option) any later version.
 *
 * mtripg6666tdr/Discord-SimpleMusicBot is distributed in the hope that it will be useful, 
 * but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with mtripg6666tdr/Discord-SimpleMusicBot. 
 * If not, see <https://www.gnu.org/licenses/>.
 */

// このファイルはGoogle Apps Scriptで動作する本音楽ボット向けデータベースバックアップAPIのコードサンプルです。
// 以下の定数を定義することによって、ほんコードを改変せずにGoogle Apps Scriptに登録し、デプロイすることができます。
//
// 'DriveFolderID' 定数（GoogleドライブのフォルダID）
// および
// 'Token' 定数（`.env`ファイルの`GAS_TOKEN`と共通の定数）
// をここに定義してください
// const DriveFolderID = '';
// const Token = '';

function doGet(e){
  const params = e.parameter;
  if(params && params.token && params.token === Token && params.guildid && params.type){
    if(params.type === "queue"){
      const ids = params.guildid.split(",");
      var result = {};
      for(var i = 0; i < ids.length; i++){
        const folder = DriveApp.getFolderById(DriveFolderID);
        const fileIt = folder.getFilesByName(ids[i] + ".json");
        if(fileIt.hasNext()){
          const file = fileIt.next();
          result[ids[i]] =file.getBlob().getDataAsString();
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: 200,
        data: result
      })).setMimeType(ContentService.MimeType.JSON);
    }else{
      const ids = params.guildid.split(",");
      var result = {};
      for(var i = 0; i < ids.length; i++){
        const prop = PropertiesService.getScriptProperties().getProperty("j" + ids[i]);
        if(prop){
          result[ids[i]] = prop;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: 200,
        data: result
      }));
    }
  }else{
    return ContentService.createTextOutput(JSON.stringify({
      status: 400
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e){
  const postData = e.postData;
  if(postData.type == "application/json"){
    const data = JSON.parse(e.postData.contents);
    if(data.token && data.token === Token && data.guildid && data.data && data.type){
      if(data.type == "queue"){
        const ids = data.guildid.split(",");
        const cdata = JSON.parse(data.data);
        for(var i = 0; i < ids.length; i++){
          const folder = DriveApp.getFolderById(DriveFolderID);
          const fileIt = folder.getFilesByName(ids[i] + ".json");
          if(fileIt.hasNext()){
            const file = fileIt.next();
            file.setContent(cdata[ids[i]]);
          }else{
            folder.createFile(ids[i] + ".json", cdata[ids[i]], "application/json");
          }
        }
        return ContentService.createTextOutput(JSON.stringify({
          status: 200
        })).setMimeType(ContentService.MimeType.JSON);
      }else{
        const ids = data.guildid.split(",");
        const cdata = JSON.parse(data.data);
        for(var i = 0; i < ids.length; i++){
          PropertiesService.getScriptProperties().setProperty("j" + ids[i], cdata[ids[i]]);
        }
        return ContentService.createTextOutput(JSON.stringify({
          status: 200
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }else{
      return ContentService.createTextOutput(JSON.stringify({
        status: 400
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }else{
    return ContentService.createTextOutput(JSON.stringify({
      status: 400
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
