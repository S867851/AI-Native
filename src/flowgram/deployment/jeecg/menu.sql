START TRANSACTION;
INSERT INTO sys_permission (id,parent_id,name,url,component,component_name,is_route,menu_type,sort_no,icon,is_leaf,keep_alive,hidden,del_flag,status,create_by,create_time)
SELECT 'fg_workspace_menu','1892553163993931777','FlowGram 工作流','/flowgram/workspace','flowgram/index','FlowgramWorkspace',1,1,10,'ant-design:apartment-outlined',0,0,0,0,'1','admin',NOW()
WHERE NOT EXISTS (SELECT 1 FROM sys_permission WHERE id='fg_workspace_menu');
INSERT INTO sys_permission (id,parent_id,name,menu_type,perms,perms_type,is_leaf,del_flag,status,create_by,create_time)
SELECT 'fg_perm_view','fg_workspace_menu','查看共享流程',2,'flowgram:view','1',1,0,'1','admin',NOW()
WHERE NOT EXISTS (SELECT 1 FROM sys_permission WHERE id='fg_perm_view');
INSERT INTO sys_permission (id,parent_id,name,menu_type,perms,perms_type,is_leaf,del_flag,status,create_by,create_time)
SELECT 'fg_perm_edit','fg_workspace_menu','编辑流程画布',2,'flowgram:edit','1',1,0,'1','admin',NOW()
WHERE NOT EXISTS (SELECT 1 FROM sys_permission WHERE id='fg_perm_edit');
INSERT INTO sys_permission (id,parent_id,name,menu_type,perms,perms_type,is_leaf,del_flag,status,create_by,create_time)
SELECT 'fg_perm_run','fg_workspace_menu','运行流程',2,'flowgram:run','1',1,0,'1','admin',NOW()
WHERE NOT EXISTS (SELECT 1 FROM sys_permission WHERE id='fg_perm_run');
INSERT INTO sys_permission (id,parent_id,name,menu_type,perms,perms_type,is_leaf,del_flag,status,create_by,create_time)
SELECT 'fg_perm_manage','fg_workspace_menu','管理共享流程',2,'flowgram:manage','1',1,0,'1','admin',NOW()
WHERE NOT EXISTS (SELECT 1 FROM sys_permission WHERE id='fg_perm_manage');
INSERT INTO sys_permission (id,parent_id,name,menu_type,perms,perms_type,is_leaf,del_flag,status,create_by,create_time)
SELECT 'fg_perm_history','fg_workspace_menu','查看团队运行记录',2,'flowgram:history','1',1,0,'1','admin',NOW()
WHERE NOT EXISTS (SELECT 1 FROM sys_permission WHERE id='fg_perm_history');
INSERT INTO sys_role_permission (id,role_id,permission_id,operate_date,operate_ip)
SELECT REPLACE(UUID(),'-',''),r.id,p.id,NOW(),'127.0.0.1' FROM sys_role r JOIN sys_permission p
ON p.id IN ('fg_workspace_menu','fg_perm_view','fg_perm_edit','fg_perm_run','fg_perm_manage','fg_perm_history')
WHERE r.role_code='admin' AND NOT EXISTS (SELECT 1 FROM sys_role_permission rp WHERE rp.role_id=r.id AND rp.permission_id=p.id);
COMMIT;
