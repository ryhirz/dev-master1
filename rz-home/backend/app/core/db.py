"""数据库引擎 / 会话 / 基类（双库可移植核心）。

- engine：依 settings.DATABASE_URL 创建；SQLite 关闭 check_same_thread 并开启外键。
- SessionLocal：请求级 session（get_db 依赖中使用）。
- init_db()：开发环境建表（Prod 走 Alembic 迁移）。
- seed()：幂等种子（角色三行、公司信息单行、默认超管）。
- 14 张表的 ORM 模型位于 app/models/*，继承 app.models.base.Base。
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings
from app.models.base import Base

_IS_SQLITE = settings.DATABASE_URL.startswith("sqlite")

connect_args = {"check_same_thread": False} if _IS_SQLITE else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

# SQLite 需手动开启外键约束（默认关闭），保证 ON DELETE RESTRICT 生效。
if _IS_SQLITE:
    @event.listens_for(engine, "connect")
    def _enable_sqlite_fk(dbapi_con, _):
        cursor = dbapi_con.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def get_db():
    """FastAPI 依赖：请求级数据库会话。"""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """创建全部表（dev SQLite 便捷；Prod 走 Alembic 迁移）。

    导入 app.models 触发全部模型元数据注册到 Base.metadata。
    """
    from app import models  # noqa: F401 确保模型注册

    Base.metadata.create_all(bind=engine)


def seed() -> None:
    """幂等种子：仅插入尚未存在的基础数据（开发/演示用）。

    - role 三角色（不指定 id，交由序列分配）。
    - company_info 单行（id=1，应用层保障仅此一条）。
    - admin_user 默认 super_admin（admin / admin123），bcrypt cost≥12。
    多次调用安全；已存在则跳过。
    """
    from app.core.security import hash_password
    from app.models.system import Role, AdminUser
    from app.models.content import CompanyInfo

    db = SessionLocal()
    try:
        # 1) 角色
        if db.query(Role).count() == 0:
            db.add_all([
                Role(name="super_admin", permissions={"*": ["read", "write"]}),
                Role(name="editor", permissions={
                    "product_series": ["read", "write"], "category": ["read", "write"],
                    "product": ["read", "write"], "cases": ["read", "write"],
                    "news": ["read", "write"], "about_section": ["read", "write"],
                    "milestone": ["read", "write"], "banner": ["read", "write"],
                    "company_info": ["read", "write"], "audit_log": ["read"],
                }),
                Role(name="cs_hr", permissions={
                    "job": ["read", "write"], "message": ["read", "write"],
                    "banner": ["read"],
                }),
            ])
            db.commit()

        # 2) 公司信息单行（id=1）
        if db.get(CompanyInfo, 1) is None:
            db.add(CompanyInfo(
                id=1, name="Rz智能家居", founded_year=1953, honor_count=200,
                production_line_count=6, address="（待填地址）", phone="（待填电话）",
                email="（待填邮箱）", icp_no="（待填备案号）",
                intro="Rz智能家居始创于 1953 年，2015 年完成智能转型，以全屋智能整装为核心，覆盖照明、安防、影音、睡眠与能源五大系统，为高端家庭提供从设计到交付的一站式智能生活解决方案。",
            ))
            db.commit()

        # 3) 默认超管（首次部署须改密）
        existing = db.query(AdminUser).filter(AdminUser.username == "admin").first()
        if existing is None:
            super_role = db.query(Role).filter(Role.name == "super_admin").first()
            db.add(AdminUser(
                username="admin",
                password_hash=hash_password("admin123"),
                display_name="管理员",
                role_id=super_role.id,
                status="active",
            ))
            db.commit()

        # 3.1) 三角色演示账号（editor / cs_hr，幂等；生产环境可删）
        demo_accounts = [
            ("editor", "editor123", "内容编辑", "editor"),
            ("cs_hr", "cshr123", "客服/HR", "cs_hr"),
        ]
        for username, pwd, display, role_name in demo_accounts:
            if db.query(AdminUser).filter(AdminUser.username == username).first() is None:
                role = db.query(Role).filter(Role.name == role_name).first()
                if role is not None:
                    db.add(AdminUser(
                        username=username,
                        password_hash=hash_password(pwd),
                        display_name=display,
                        role_id=role.id,
                        status="active",
                    ))
        db.commit()

        # 4) 演示目录数据（曲库灌库，支持无 key 演示）
        _seed_catalog(db)

    finally:
        db.close()


def _seed_catalog(db: Session) -> None:
    """演示目录种子（M6 升级为高端全屋智能家居）：系列/分类/产品/案例/新闻/轮播/历程/关于/招聘。

    仅当对应表为空时插入（幂等）；图片为 Unsplash 智能家居实景（已逐张验证可访问）。
    """
    from datetime import datetime, timezone
    from app.models.catalog import ProductSeries, Category, Product
    from app.models.content import Cases, News, Banner, AboutSection, Milestone
    from app.models.crm import Job

    now = datetime(2026, 8, 1, 0, 0, 0, tzinfo=timezone.utc)
    U = "https://images.unsplash.com/photo-{id}?w=1200&q=80&auto=format&fit=crop"

    def img(*ids):
        return [U.format(id=i) for i in ids]

    def img1(i):
        return U.format(id=i)

    # 产品系列（高端全屋智能）
    if db.query(ProductSeries).count() == 0:
        db.add_all([
            ProductSeries(id=1, name="全屋智能", slug="smart-whole",
                          cover_image=img1("1558002038-1055907df827"),
                          description="全屋联动、一屏掌控的全场景智能中枢。", sort_order=1),
            ProductSeries(id=2, name="智能照明", slug="smart-lighting",
                          cover_image=img1("1513694203232-719a280e022f"),
                          description="无主灯设计与全屋调光，光随人动。", sort_order=2),
            ProductSeries(id=3, name="智能安防", slug="smart-security",
                          cover_image=img1("1523217582562-09d0def993a6"),
                          description="门锁、监控、传感一体化，安心守护。", sort_order=3),
            ProductSeries(id=4, name="影音娱乐", slug="smart-av",
                          cover_image=img1("1600607688969-a5bfcd646154"),
                          description="沉浸式影音与多房间音乐系统。", sort_order=4),
            ProductSeries(id=5, name="智能睡眠", slug="smart-sleep",
                          cover_image=img1("1505693416388-ac5ce068fe85"),
                          description="睡眠监测智能床与助眠环境系统。", sort_order=5),
        ])
        db.commit()

    # 空间分类
    if db.query(Category).count() == 0:
        db.add_all([
            Category(id=1, name="客厅", slug="living", sort_order=1),
            Category(id=2, name="卧室", slug="bedroom", sort_order=2),
            Category(id=3, name="厨房", slug="kitchen", sort_order=3),
            Category(id=4, name="全屋", slug="whole", sort_order=4),
        ])
        db.commit()

    # 产品 30 款（每系列 6 款，高端定位，含智能功能/协议/控制方式）
    if db.query(Product).count() == 0:
        db.add_all([
            # ---- 全屋智能 ----
            Product(series_id=1, category_id=4, name="智能中枢网关", model_no="SH-GW-01",
                    summary="全屋设备统一接入，断网本地联动依旧可靠。",
                    description="搭载 Matter/蓝牙 Mesh 双协议，可接入 200+ 设备；本地算力支持断网场景联动，数据不出网关更安心。",
                    images=img("1558002038-1055907df827", "1600607687939-ce8a6c25118c"),
                    specs={"控制方式": "APP/语音/面板", "协议": "Matter·蓝牙Mesh·Wi-Fi", "供电": "Type-C 5V/2A", "尺寸": "112×112×28mm", "风格": "极简高端"},
                    price=6999, is_recommended=True),
            Product(series_id=1, category_id=4, name="全屋智能语音面板", model_no="SH-PN-02",
                    summary="86 底盒安装，本地语音控制无需唤醒词排队。",
                    description="内置远场双麦克风阵列，支持多轮对话与方言识别；一键场景：回家/离家/观影/睡眠。",
                    images=img("1600566753190-17f0baa2a6c3"),
                    specs={"控制方式": "语音/触控", "麦克风": "双麦远场", "安装": "86 底盒", "供电": "零火线", "风格": "高端金属"},
                    price=5999, is_recommended=True),
            Product(series_id=1, category_id=4, name="智能场景控制屏", model_no="SH-SC-03",
                    summary="10.1 英寸触控屏，全屋状态一屏尽览。",
                    description="可视对讲、安防告警、影音控制、能耗统计集成一屏；支持壁挂与嵌入安装。",
                    images=img("1600607687920-4e2a09cf159d", "1600607688969-a5bfcd646154"),
                    specs={"屏幕": "10.1″ 触控", "对讲": "室内机可视对讲", "安装": "壁挂/嵌入", "供电": "POE/12V", "风格": "极简高端"},
                    price=8999, is_recommended=True),
            Product(series_id=1, category_id=4, name="智能窗帘电机套装", model_no="SH-CT-04",
                    summary="静音直流电机，定时/光感/语音三重控制。",
                    description="30dB 超静音运行，支持停电手拉；接入场景后自动随日出日落开合。",
                    images=img("1616486029423-aaa4789e8c9a"),
                    specs={"电机": "直流静音", "噪音": "≤30dB", "供电": "220V", "长度": "1.5-3m 轨", "风格": "隐形安装"},
                    price=3499, is_recommended=False),
            Product(series_id=1, category_id=4, name="智能插座能源管家", model_no="SH-SO-05",
                    summary="用电可视化 + 远程断电，家电能耗一目了然。",
                    description="实时功率曲线与月度能耗报表，异常大功率自动断电保护，支持定时与场景联动。",
                    images=img("1571008887538-b36bb32f4571"),
                    specs={"额定": "2500W", "计量": "高精度电能计量", "协议": "蓝牙Mesh", "安全": "过载断电", "风格": "阻燃白"},
                    price=2999, is_recommended=False),
            Product(series_id=1, category_id=4, name="全屋智能整装方案", model_no="SH-TL-06",
                    summary="设计+施工+调校一站式，交付即用。",
                    description="资深智能家居设计师上门勘测，覆盖灯光/窗帘/安防/影音/睡眠五大系统，含三年质保与远程调校。",
                    images=img("1600585154340-be6161a56a0c", "1522708323590-d24dbb6b0267"),
                    specs={"服务": "勘测·设计·施工·调校", "覆盖": "五大系统", "质保": "整屋三年", "风格": "高端定制"},
                    price=12999, is_recommended=True),
            # ---- 智能照明 ----
            Product(series_id=2, category_id=1, name="无主灯智能吸顶灯", model_no="SL-CL-01",
                    summary="双色温调光调色，客餐厅一体化照明。",
                    description="Ra95 高显色光源，2700K-6500K 无级调色；支持灯带/筒灯场景联动，营造观影与会客氛围。",
                    images=img("1513694203232-719a280e022f", "1586023492125-27b2c045efd7"),
                    specs={"光源": "双色温 LED", "显色": "Ra95", "功率": "120W", "控制": "APP/语音/面板", "风格": "极简无主灯"},
                    price=4599, is_recommended=True),
            Product(series_id=2, category_id=4, name="智能调光氛围灯带", model_no="SL-STR-02",
                    summary="1600 万色灯带，可裁剪可延长。",
                    description="软质 RGB 灯带，支持音乐律动与场景联动；阳台、柜体、踢脚线均可安装。",
                    images=img("1618220179428-22790b461013"),
                    specs={"长度": "5m 可裁剪", "色域": "1600万色", "协议": "蓝牙Mesh", "功率": "30W", "风格": "氛围光影"},
                    price=1299, is_recommended=False),
            Product(series_id=2, category_id=2, name="人体感应地脚灯", model_no="SL-SEN-03",
                    summary="起夜自动亮起，柔光不刺眼。",
                    description="雷达感应 3-5m 范围，深夜起夜自动点亮 30cm 高柔光带，避免全屋强光打扰睡眠。",
                    images=img("1600566753190-17f0baa2a6c3"),
                    specs={"感应": "毫米波雷达", "色温": "3000K 暖光", "高度": "离地30cm", "供电": "低压 24V", "风格": "隐形嵌入"},
                    price=799, is_recommended=False),
            Product(series_id=2, category_id=2, name="智能护眼阅读灯", model_no="SL-READ-04",
                    summary="无频闪全光谱，三档色温适配阅读。",
                    description="全光谱无蓝光危害，亮度随环境光自动补偿；桌面读写、床头夜读两相宜。",
                    images=img("1524758631624-e2822e304c36"),
                    specs={"光源": "全光谱 LED", "频闪": "无频闪", "色温": "三档", "控制": "触摸/APP", "风格": "极简金属"},
                    price=1999, is_recommended=False),
            Product(series_id=2, category_id=4, name="全屋调光面板", model_no="SL-PN-05",
                    summary="一路面板控全屋灯组，支持旋钮与触控。",
                    description="面板可绑定任意灯组，旋钮精准调光，长按切换场景；金属拉丝质感，媲美进口品牌。",
                    images=img("1600607687920-4e2a09cf159d"),
                    specs={"控制": "旋钮+触控", "路数": "单面板多组", "安装": "86 底盒", "供电": "零火线", "风格": "金属拉丝"},
                    price=2399, is_recommended=False),
            Product(series_id=2, category_id=2, name="智能夜灯起夜引导系统", model_no="SL-NIGHT-06",
                    summary="卧室到卫生间全程柔和引导光。",
                    description="多点位低照度感应灯，形成连续引导路径；亮度低于 8 勒克斯，不影响二次入睡。",
                    images=img("1505693416388-ac5ce068fe85"),
                    specs={"点位": "卧室-走廊-卫浴", "照度": "≤8Lux", "感应": "雷达", "供电": "低压安全", "风格": "隐形设计"},
                    price=1599, is_recommended=False),
            # ---- 智能安防 ----
            Product(series_id=3, category_id=4, name="3D 人脸智能门锁", model_no="SS-LK-01",
                    summary="3D 人脸+指纹+密码多方式解锁，金融级安全。",
                    description="TOF 3D 人脸识别防照片/视频攻击，0.6s 识别；虚位密码防偷窥，异常撬锁即时告警推送。",
                    images=img("1523217582562-09d0def993a6", "1560518883-ce09059eeffa"),
                    specs={"解锁": "3D人脸/指纹/密码/卡", "安全": "金融级加密", "续航": "6 个月/次充电", "联动": "回家场景", "风格": "高端锌合金"},
                    price=3999, is_recommended=True),
            Product(series_id=3, category_id=4, name="智能可视门铃", model_no="SS-DB-02",
                    summary="2K 高清+红外夜视，门口异常实时推送。",
                    description="门前包裹/人员逗留 AI 识别，双向语音对讲；与门锁联动自动抓拍留证。",
                    images=img("1600607688969-a5bfcd646154"),
                    specs={"画质": "2K HDR", "夜视": "红外", "AI": "人形/包裹识别", "供电": "充电/POE", "风格": "极简"},
                    price=2199, is_recommended=False),
            Product(series_id=3, category_id=4, name="全屋安防传感套装", model_no="SS-SET-03",
                    summary="门窗磁、人体、烟雾、漏水一网打尽。",
                    description="8 件套传感器覆盖门窗/室内/厨房/阳台，异常联动警笛+推送+灯光闪烁三重提醒。",
                    images=img("1600607687939-ce8a6c25118c"),
                    specs={"套装": "8 件套", "传感": "门窗磁·人体·烟雾·漏水", "联动": "警笛/灯光/推送", "协议": "蓝牙Mesh", "风格": "全屋守护"},
                    price=4999, is_recommended=True),
            Product(series_id=3, category_id=4, name="室内云台摄像头", model_no="SS-CAM-04",
                    summary="360° 云台+隐私遮蔽，看家看宠两相宜。",
                    description="2K 画质、双向对讲，物理隐私遮蔽罩；宠物检测自动跟拍萌宠瞬间。",
                    images=img("1600210492486-724fe5c67fb0"),
                    specs={"画质": "2K", "云台": "360°", "AI": "人形/宠物识别", "存储": "TF/云存", "风格": "白色极简"},
                    price=1299, is_recommended=False),
            Product(series_id=3, category_id=3, name="燃气/水浸传感器", model_no="SS-GAS-05",
                    summary="厨房双保险，泄漏秒级联动关阀。",
                    description="燃气泄漏浓度阈值触发声光告警并联动电磁阀关断；水浸传感器监测漏水，防止地板泡损。",
                    images=img("1600566753086-00f18fb6b3ea"),
                    specs={"燃气": "甲烷/丙烷", "水浸": "触点式", "联动": "电磁阀/推送", "供电": "电池 2 年", "风格": "阻燃白"},
                    price=699, is_recommended=False),
            Product(series_id=3, category_id=4, name="智能猫眼电子锁套装", model_no="SS-LK-06",
                    summary="猫眼+门锁一体，门外看得清，门内控得稳。",
                    description="指纹开锁联动猫眼抓拍开门瞬间，APP 远程查看门外画面，访客到访自动推送。",
                    images=img("1600585154340-be6161a56a0c"),
                    specs={"一体": "猫眼+锁体", "解锁": "指纹/密码/卡", "联动": "抓拍/对讲", "续航": "双电池", "风格": "锌合金黑"},
                    price=5999, is_recommended=False),
            # ---- 影音娱乐 ----
            Product(series_id=4, category_id=1, name="智能回音壁音响", model_no="AV-SB-01",
                    summary="杜比全景声+天空声道，客厅影院即插即用。",
                    description="5.1.2 物理声道布局，HDMI eARC 一线连接电视；内置流媒体与语音助手，观影/音乐/游戏多场景。",
                    images=img("1572569511254-d8f925fe2cbb", "1522708323590-d24dbb6b0267"),
                    specs={"声道": "5.1.2", "音效": "杜比全景声", "接口": "HDMI eARC", "控制": "语音/APP", "风格": "高端织物"},
                    price=7999, is_recommended=True),
            Product(series_id=4, category_id=4, name="多房间音乐系统", model_no="AV-MR-02",
                    summary="全屋同步/分区播放，一台主控带满屋。",
                    description="支持 8 区独立播放，各房间可同步或分区；主卧入睡自动降音量，晨起闹钟式渐强唤醒。",
                    images=img("1538688525198-9b88f6f53126"),
                    specs={"分区": "8 区", "协议": "Wi-Fi 组网", "音源": "流媒体/本地", "控制": "APP/语音", "风格": "隐形吸顶"},
                    price=10999, is_recommended=False),
            Product(series_id=4, category_id=1, name="智能投影影院套装", model_no="AV-PJ-03",
                    summary="4K 激光投影+抗光幕布，白天也能看。",
                    description="4K 激光光源 3000 流明，搭配 100 寸抗光幕；自动梯形校正与对焦，一键进入观影场景。",
                    images=img("1600607688969-a5bfcd646154"),
                    specs={"光源": "4K 激光", "亮度": "3000 流明", "幕布": "100″ 抗光", "场景": "观影联动", "风格": "家庭影院"},
                    price=13999, is_recommended=True),
            Product(series_id=4, category_id=1, name="4K 智能电视柜体", model_no="AV-TV-04",
                    summary="电视+柜体一体化，线缆全隐藏。",
                    description="定制柜体预埋 HDMI/电源，电视嵌入式安装；升降电动支架，观影高度随心调节。",
                    images=img("1586023492125-27b2c045efd7", "1616486338812-3dadae4b4ace"),
                    specs={"电视": "65-86″", "支架": "电动升降", "柜体": "实木定制", "线缆": "全隐藏", "风格": "高端整装"},
                    price=8999, is_recommended=False),
            Product(series_id=4, category_id=4, name="智能影音中控", model_no="AV-CT-05",
                    summary="一键切换观影/K歌/游戏场景。",
                    description="统一管理电视/投影/音响/灯光/窗帘，语音指令直达场景；支持定时与离家自动关闭。",
                    images=img("1600566753190-17f0baa2a6c3"),
                    specs={"场景": "观影/K歌/游戏", "联动": "灯光·窗帘·音响", "协议": "Matter", "控制": "语音/面板", "风格": "集成中控"},
                    price=6999, is_recommended=False),
            Product(series_id=4, category_id=2, name="电竞书房声光系统", model_no="AV-ES-06",
                    summary="书房变战场，氛围灯随游戏律动。",
                    description="低延迟 2.4G 无线环绕 + 桌面 RGB 氛围灯带，游戏高光时刻自动触发灯光特效。",
                    images=img("1524758631624-e2822e304c36", "1493663284031-b7e3aefcae8e"),
                    specs={"延迟": "<20ms", "音频": "2.1 环绕", "灯效": "音乐律动", "接口": "USB/3.5mm", "风格": "电竞氛围"},
                    price=9999, is_recommended=False),
            # ---- 智能睡眠 ----
            Product(series_id=5, category_id=2, name="智能监测电动床", model_no="SS2-BD-01",
                    summary="心率呼吸监测 + 头脚升降，睡个好觉。",
                    description="床垫内嵌压电传感，无感监测心率/呼吸/体动；头脚独立升降，打鼾时自动微调头枕角度。",
                    images=img("1505693416388-ac5ce068fe85", "1512446816042-444d641267d4"),
                    specs={"监测": "心率/呼吸/体动", "升降": "头脚独立", "打鼾干预": "自动微调", "报告": "晨间推送", "风格": "高端床具"},
                    price=25999, is_recommended=True),
            Product(series_id=5, category_id=2, name="智能助眠灯枕", model_no="SS2-PL-02",
                    summary="助眠声光+香氛，30 分钟入睡引导。",
                    description="内置助眠音效库与褪黑素友好暖光，辅以香氛模块；检测到入睡后自动全部熄灭。",
                    images=img("1598300042247-d088f8ab3a91"),
                    specs={"音效": "助眠音库", "灯光": "3000K 暖光", "香氛": "可更换", "检测": "入睡自动熄", "风格": "柔光助眠"},
                    price=4999, is_recommended=False),
            Product(series_id=5, category_id=2, name="全屋睡眠环境系统", model_no="SS2-ENV-03",
                    summary="温湿度、空气、光线全维度护航深睡。",
                    description="联动空调/新风/加湿/窗帘/灯光，睡前自动进入恒温恒湿恒氧的深睡环境。",
                    images=img("1618220179428-22790b461013", "1533090161767-e6ffed986c88"),
                    specs={"维度": "温湿度·空气·光线", "联动": "空调/新风/窗帘", "模式": "深睡模式", "报告": "睡眠周报", "风格": "全屋环境"},
                    price=32999, is_recommended=True),
            Product(series_id=5, category_id=2, name="智能温控被", model_no="SS2-BL-04",
                    summary="分区温控被芯，手脚不再冰凉。",
                    description="分区石墨烯加热，脚部区温度高于躯干区 2-3℃；预约预热，被窝永远刚刚好。",
                    images=img("1555041469-a586c61ea9bc"),
                    specs={"分区": "躯干/脚部分区", "加热": "石墨烯", "温控": "±1℃", "预约": "睡前预热", "风格": "轻盈羽绒"},
                    price=3999, is_recommended=False),
            Product(series_id=5, category_id=2, name="睡眠数据分析仪", model_no="SS2-DA-05",
                    summary="床边即测，晨间输出深睡/REM 报告。",
                    description="毫米波雷达非接触监测，深睡时长、REM、翻身次数、呼吸节律一页看懂，异常指标自动建议。",
                    images=img("1540574163026-643ea20ade25"),
                    specs={"技术": "毫米波雷达", "指标": "深睡/REM/呼吸", "报告": "晨间推送", "隐私": "本地处理", "风格": "床头隐形"},
                    price=2999, is_recommended=False),
            Product(series_id=5, category_id=2, name="智能床垫护理系统", model_no="SS2-CARE-06",
                    summary="除螨烘干+软硬可调，久用如新。",
                    description="内循环热风除螨除湿，APP 一键护理；左右独立软硬分区，夫妻同床不同感。",
                    images=img("1505693416388-ac5ce068fe85"),
                    specs={"护理": "除螨/除湿/烘干", "分区": "左右独立", "材质": "乳胶+弹簧", "控制": "APP", "风格": "高端床垫"},
                    price=18999, is_recommended=False),
        ])
        db.commit()

    # 案例（8 个，全屋智能主题）
    if db.query(Cases).count() == 0:
        db.add_all([
            Cases(title="300㎡ 大平层全屋智能整装", category="住宅",
                  summary="五大系统一体交付，回家即场景。",
                  content="覆盖智能照明、电动窗帘、影音娱乐、安防传感与智能睡眠五大系统，全屋语音/面板/APP 三重控制，交付后零学习成本。",
                  cover_image=img1("1586023492125-27b2c045efd7"), images=img("1586023492125-27b2c045efd7", "1600607688969-a5bfcd646154"),
                  is_new=True, sort_order=1),
            Cases(title="别墅智能照明与影音改造", category="住宅",
                  summary="无主灯×全景声，别墅氛围升级。",
                  content="负一层影音室引入 5.1.2 全景声与投影影院场景，全宅无主灯调光系统按动线自动亮灭，能耗下降约 30%。",
                  cover_image=img1("1513694203232-719a280e022f"), images=img("1513694203232-719a280e022f", "1572569511254-d8f925fe2cbb"),
                  is_new=True, sort_order=2),
            Cases(title="高端公寓无主灯氛围系统", category="住宅",
                  summary="小户型也能全屋智能。",
                  content="60㎡ 公寓以灯带+射灯+地脚灯构建多层次照明，人体感应自动亮灯，夜间起夜全程柔光引导。",
                  cover_image=img1("1600607687920-4e2a09cf159d"), images=img("1600607687920-4e2a09cf159d"),
                  is_new=False, sort_order=3),
            Cases(title="五星酒店智能客房方案", category="商业",
                  summary="客房无卡取电、语音客控，好评率提升。",
                  content="为 200 间客房部署语音客控与无卡取电，住客一句话控制灯光/窗帘/空调，降低能耗同时提升住客体验。",
                  cover_image=img1("1600607687939-ce8a6c25118c"), images=img("1600607687939-ce8a6c25118c", "1618220179428-22790b461013"),
                  is_new=False, sort_order=4),
            Cases(title="智慧办公空间光感控制", category="工程",
                  summary="工位级调光与会议室一键场景。",
                  content="办公区按工位分区调光，会议场景一键切换演示/讨论模式；人体占位传感器联动空调新风节能。",
                  cover_image=img1("1600566753190-17f0baa2a6c3"), images=img("1600566753190-17f0baa2a6c3"),
                  is_new=False, sort_order=5),
            Cases(title="养老社区智能安防照护", category="工程",
                  summary="毫米波雷达守护，跌倒即告警。",
                  content="为社区 120 户长者住宅部署人体存在雷达与跌倒检测，异常事件秒级推送家属与护理站，夜间起夜自动亮灯防跌倒。",
                  cover_image=img1("1523217582562-09d0def993a6"), images=img("1523217582562-09d0def993a6", "1560518883-ce09059eeffa"),
                  is_new=False, sort_order=6),
            Cases(title="智能家居展厅沉浸式体验", category="商业",
                  summary="动线即场景，进店即回家。",
                  content="展厅按真实户型还原回家/观影/睡眠场景，顾客语音即可体验全屋联动，成交转化显著提升。",
                  cover_image=img1("1616486029423-aaa4789e8c9a"), images=img("1616486029423-aaa4789e8c9a", "1600585154340-be6161a56a0c"),
                  is_new=True, sort_order=7),
            Cases(title="大宅全屋语音控制样板", category="住宅",
                  summary="一句话控制全屋 300+ 设备。",
                  content="整宅 300+ 智能设备统一接入中枢网关，多轮语音对话直达任意场景，样板间开放首周预约参观超 500 组。",
                  cover_image=img1("1618221195710-dd6b41faaea6"), images=img("1618221195710-dd6b41faaea6", "1522708323590-d24dbb6b0267"),
                  is_new=False, sort_order=8),
        ])
        db.commit()

    # 新闻（6 篇，智能家居行业）
    if db.query(News).count() == 0:
        db.add_all([
            News(title="Rz智能 2026 全屋智能 2.0 发布会圆满落幕", category="company",
                 summary="五大系统 + 场景引擎同步亮相。",
                 content="发布会正式发布全屋智能 2.0：以中枢网关为核心，覆盖照明/安防/影音/睡眠/能源五大系统，场景引擎支持用户自定义多条件联动。",
                 cover_image=img1("1558002038-1055907df827"), author="品牌中心", published_at=now, is_top=True, status="published"),
            News(title="Rz智能获评年度全屋智能影响力品牌", category="company",
                 summary="连续三年入选行业榜单。",
                 content="凭借整装交付能力与场景化体验，Rz智能连续三年入选年度全屋智能影响力品牌，单套方案平均接入设备数行业领先。",
                 cover_image=img1("1600607687939-ce8a6c25118c"), author="品牌中心",
                 published_at=datetime(2026, 7, 12, 0, 0, 0, tzinfo=timezone.utc), is_top=False, status="published"),
            News(title="全系产品完成 Matter 协议升级", category="company",
                 summary="跨品牌互联互通更进一步。",
                 content="即日起全系网关、面板与传感器支持 Matter 1.3，可与其他主流品牌设备本地直连，云端断连也不影响联动。",
                 cover_image=img1("1600607687920-4e2a09cf159d"), author="产品部",
                 published_at=datetime(2026, 6, 28, 0, 0, 0, tzinfo=timezone.utc), is_top=False, status="published"),
            News(title="行业观察：全屋智能进入场景化时代", category="industry",
                 summary="从单品智能到全屋体验。",
                 content="报告指出，消费者已不再满足于单个音箱或门锁，而更看重回家、观影、睡眠等真实场景的整体体验，整装交付成为趋势。",
                 cover_image=img1("1616486029423-aaa4789e8c9a"), author="行业研究",
                 published_at=datetime(2026, 6, 20, 0, 0, 0, tzinfo=timezone.utc), is_top=False, status="published"),
            News(title="趋势｜无主灯与氛围光设计走俏", category="industry",
                 summary="调光调色成为新装标配。",
                 content="调研显示，超六成新装家庭选择无主灯设计，动态氛围光与语音调光需求快速增长，智能照明渗透率持续走高。",
                 cover_image=img1("1513694203232-719a280e022f"), author="趋势研究",
                 published_at=datetime(2026, 5, 8, 0, 0, 0, tzinfo=timezone.utc), is_top=False, status="published"),
            News(title="深度：智能睡眠如何改善都市人睡眠", category="industry",
                 summary="监测、干预、环境三位一体。",
                 content="从睡眠监测到打鼾干预再到环境联动，智能睡眠系统正帮助都市人群缩短入睡时间，深睡时长平均提升 12%。",
                 cover_image=img1("1505693416388-ac5ce068fe85"), author="编辑部",
                 published_at=datetime(2026, 4, 15, 0, 0, 0, tzinfo=timezone.utc), is_top=False, status="published"),
        ])
        db.commit()

    # 轮播
    if db.query(Banner).count() == 0:
        db.add_all([
            Banner(title="全屋智能 2.0 全新上市", image="https://images.unsplash.com/photo-1558002038-1055907df827?w=1920&q=80&auto=format&fit=crop", link_url="/products?series_id=1", sort_order=1),
            Banner(title="智能照明 · 光随人动", image="https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1920&q=80&auto=format&fit=crop", link_url="/products?series_id=2", sort_order=2),
            Banner(title="高端定制 · 全屋语音控制", image="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80&auto=format&fit=crop", link_url="/products", sort_order=3),
        ])
        db.commit()

    # 发展历程（含智能转型节点）
    if db.query(Milestone).count() == 0:
        db.add_all([
            Milestone(year="1953", title="品牌创立", description="前身木质家具厂成立，以手工木作起家。", sort_order=1, status="active"),
            Milestone(year="1985", title="自建工厂", description="引入现代化生产线，实现规模化制造。", sort_order=2, status="active"),
            Milestone(year="2001", title="全国布局", description="直营与经销网络覆盖全国主要城市。", sort_order=3, status="active"),
            Milestone(year="2015", title="智能转型", description="成立智能家居事业部，首套全屋控制系统落地。", sort_order=4, status="active"),
            Milestone(year="2026", title="全屋智能 2.0", description="五大智能系统整装交付，Matter 全系互联。", sort_order=5, status="active"),
        ])
        db.commit()

    # 关于区块（overview/brand 文案升级为智能家居定位）
    if db.query(AboutSection).count() == 0:
        db.add_all([
            AboutSection(code="overview", title="关于 Rz智能", content="<p>Rz智能始于 1953 年的木作工坊，2015 年完成智能转型，如今为高端家庭提供全屋智能整装服务——从灯光到安防，从影音到睡眠，一个中枢掌控全部。</p>", sort_order=1, status="active"),
            AboutSection(code="brand", title="品牌理念", content="<p>我们相信，好的智能不是堆砌设备，而是让家更懂你。以设计为骨、以科技为翼，Rz智能让每一个家都拥有从容、安静、有温度的高级感。</p>", sort_order=2, status="active"),
        ])
        db.commit()

    # 招聘（保留制造/设计，新增智能硬件岗位）
    if db.query(Job).count() == 0:
        db.add_all([
            Job(type="social", title="智能硬件产品经理", department="智能事业部", city="杭州",
                salary="25-40K·14薪", headcount=2,
                description="负责智能家居单品与场景方案定义，跟进研发到上市全流程。",
                requirements="3 年以上智能硬件/消费电子产品经验，熟悉 Matter/蓝牙 Mesh 协议优先。", status="active"),
            Job(type="social", title="全屋智能交付工程师", department="工程交付", city="杭州",
                salary="15-25K·14薪", headcount=4,
                description="负责全屋智能项目勘测、施工管理与调试验收。",
                requirements="2 年以上弱电/智能家居交付经验，能接受短期出差。", status="active"),
            Job(type="social", title="嵌入式软件工程师", department="智能事业部", city="杭州",
                salary="30-50K·14薪", headcount=3,
                description="负责网关与设备固件开发，优化本地联动链路。",
                requirements="精通 C/RTOS，熟悉 Wi-Fi/蓝牙协议栈与低功耗设计。", status="active"),
            Job(type="social", title="空间设计总监", department="设计中心", city="杭州",
                salary="面议", headcount=1,
                description="主导高端全屋智能整装的设计语言与场景体验。",
                requirements="8 年以上高端室内/家具设计经验，有智能家居项目者优先。", status="active"),
            Job(type="campus", title="管培生（智能硬件方向）", department="智能事业部", city="杭州",
                salary="面议", headcount=5,
                description="轮岗硬件、固件、产品，培养智能家居骨干。",
                requirements="2026 届本科及以上，电子/计算机/自动化相关专业。", status="active"),
            Job(type="campus", title="设计管培生", department="设计中心", city="杭州",
                salary="面议", headcount=3,
                description="参与智能场景与产品设计，跟随资深设计师成长。",
                requirements="工业设计/交互设计相关专业，作品集优先。", status="active"),
        ])
        db.commit()
