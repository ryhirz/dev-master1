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
                id=1, name="Rz家居", founded_year=1953, honor_count=200,
                production_line_count=6, address="（待填地址）", phone="（待填电话）",
                email="（待填邮箱）", icp_no="（待填备案号）",
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
    """演示目录种子：系列/分类/产品/案例/新闻/轮播/历程/关于/招聘。

    仅当对应表为空时插入（幂等），便于无 API key 直接演示前台官网。
    图片字段留空 -> 前台以胡桃木渐变占位，无需外部素材。
    """
    from datetime import datetime, timezone
    from app.models.catalog import ProductSeries, Category, Product
    from app.models.content import Cases, News, Banner, AboutSection, Milestone
    from app.models.crm import Job

    now = datetime(2026, 8, 1, 0, 0, 0, tzinfo=timezone.utc)

    # 产品系列
    if db.query(ProductSeries).count() == 0:
        db.add_all([
            ProductSeries(id=1, name="现代简约", slug="modern",
                          description="线条利落、功能至上的当代生活方式。", sort_order=1),
            ProductSeries(id=2, name="新中式", slug="chinese",
                          description="东方意境与现代工艺的融合。", sort_order=2),
            ProductSeries(id=3, name="北欧自然", slug="nordic",
                          description="原木、羊毛与柔和色调的温暖居所。", sort_order=3),
        ])
        db.commit()

    # 空间分类
    if db.query(Category).count() == 0:
        db.add_all([
            Category(id=1, name="客厅", slug="living", sort_order=1),
            Category(id=2, name="卧室", slug="bedroom", sort_order=2),
            Category(id=3, name="餐厅", slug="dining", sort_order=3),
        ])
        db.commit()

    # 产品（images 留空 -> 前台渐变占位）
    if db.query(Product).count() == 0:
        db.add_all([
            Product(series_id=1, category_id=1, name="云朵布艺沙发", model_no="M-SF-01",
                    summary="羽绒感坐感，可拆洗布套，适配中小户型客厅。",
                    description="云朵沙发以圆润倒角弱化空间棱角，高密度回弹海绵搭配羽绒层，久坐不塌。布套可整体拆洗，方便日常养护。",
                    images=[], specs={"材质": "实木框架＋羽绒", "尺寸": "240×95×82cm", "风格": "现代简约", "颜色": "米白"},
                    price=8990, is_recommended=True),
            Product(series_id=3, category_id=3, name="橡木伸缩餐桌", model_no="N-TB-02",
                    summary="FSC 认证白橡木，可伸缩满足 4–8 人用餐。",
                    description="桌面采用整块白橡木拼板，木纹连续自然。中部可伸缩扩展，平时收拢节省空间，聚宴时展开从容。",
                    images=[], specs={"材质": "白橡木", "尺寸": "140–200×90cm", "风格": "北欧自然", "颜色": "原木"},
                    price=5280, is_recommended=False),
            Product(series_id=2, category_id=2, name="胡桃木双人床", model_no="C-BD-03",
                    summary="黑胡桃实木框架，低姿东方美学。",
                    description="取黑胡桃木之沉稳，床屏以简练线条勾勒远山意象，离地悬挑便于清扫，睡感安静踏实。",
                    images=[], specs={"材质": "黑胡桃木", "尺寸": "1800×2000mm", "风格": "新中式", "颜色": "胡桃"},
                    price=12600, is_recommended=True),
            Product(series_id=1, category_id=1, name="极简悬浮电视柜", model_no="M-TV-04",
                    summary="墙悬浮设计，收纳与轻盈兼得。",
                    description="悬挑式柜体减少地面占用，隐藏式线缆管理让客厅更整洁。哑光烤漆面耐污易擦。",
                    images=[], specs={"材质": "多层实木＋烤漆", "尺寸": "200×40×45cm", "风格": "现代简约", "颜色": "暖灰"},
                    price=3680, is_recommended=False),
            Product(series_id=3, category_id=1, name="羊毛休闲椅", model_no="N-CH-05",
                    summary="整张羊毛包裹，阅读角的最佳陪伴。",
                    description="椅身以曲木热弯成型，外包整张羊毛，触感温润。配有可旋转实木脚，转向随心。",
                    images=[], specs={"材质": "曲木＋羊毛", "尺寸": "72×78×85cm", "风格": "北欧自然", "颜色": "燕麦"},
                    price=2980, is_recommended=True),
            Product(series_id=2, category_id=2, name="中式罗汉床", model_no="C-LH-06",
                    summary="可坐可卧，茶室与卧室皆宜。",
                    description="延续明式罗汉床形制，三面围子以简素线条呈现，既可待客品茗，亦可午后小憩。",
                    images=[], specs={"材质": "榆木", "尺寸": "2000×950mm", "风格": "新中式", "颜色": "原木"},
                    price=9800, is_recommended=False),
            Product(series_id=1, category_id=3, name="岩板餐边柜", model_no="M-CB-07",
                    summary="12mm 进口岩板台面，防泼溅易清洁。",
                    description="台面采用进口岩板，耐高温抗渗色；柜体内部分区收纳餐具与酒水，缓冲铰链静音开合。",
                    images=[], specs={"材质": "岩板＋实木", "尺寸": "120×40×85cm", "风格": "现代简约", "颜色": "云雾白"},
                    price=4360, is_recommended=False),
            Product(series_id=3, category_id=2, name="实木书桌", model_no="N-DK-08",
                    summary="A4 大台面，居家办公安静之选。",
                    description="桌腿以白橡木方料榫接，承重大且稳；线孔藏于侧后，桌面清爽无杂物。",
                    images=[], specs={"材质": "白橡木", "尺寸": "120×60×75cm", "风格": "北欧自然", "颜色": "原木"},
                    price=2560, is_recommended=False),
            Product(series_id=2, category_id=1, name="月洞门玄关柜", model_no="C-XG-09",
                    summary="圆融月洞意象，入户第一道风景。",
                    description="以月洞门为母题，镂空借景，柜体可收纳鞋履与随身物，兼作入户端景。",
                    images=[], specs={"材质": "胡桃木", "尺寸": "100×35×110cm", "风格": "新中式", "颜色": "胡桃"},
                    price=6180, is_recommended=True),
            Product(series_id=1, category_id=2, name="模块储物柜", model_no="M-ST-10",
                    summary="自由组合，随成长扩展收纳。",
                    description="标准单元可横向纵向拼接，适应卧室、儿童房等多场景；圆角处理更安全。",
                    images=[], specs={"材质": "颗粒板＋实木边框", "尺寸": "80×40×120cm/单元", "风格": "现代简约", "颜色": "燕麦白"},
                    price=1980, is_recommended=False),
        ])
        db.commit()

    # 案例
    if db.query(Cases).count() == 0:
        db.add_all([
            Cases(title="城东叠墅·现代简约整屋", category="住宅",
                  summary="以云朵沙发与悬浮柜构建通透起居。",
                  content="本案为 180㎡ 叠墅，业主偏好利落线条。客厅以云朵布艺沙发为中心，搭配极简悬浮电视柜，释放地面空间；餐厨一体以岩板餐边柜收束动线。",
                  images=[], is_new=True, sort_order=1),
            Cases(title="滨江样板间·新中式", category="住宅",
                  summary="胡桃木与月洞门演绎东方栖居。",
                  content="样板间以新中式为主线，卧室选用胡桃木双人床，玄关以月洞门玄关柜作端景，整体沉稳而不压抑。",
                  images=[], is_new=True, sort_order=2),
            Cases(title="某五星酒店公区·北欧自然", category="商业",
                  summary="羊毛休闲椅与橡木餐桌营造温暖大堂。",
                  content="酒店公区引入北欧自然系列，羊毛休闲椅围合阅读角，橡木伸缩餐桌服务全天候轻食，木色缓和商务冷感。",
                  images=[], is_new=False, sort_order=3),
            Cases(title="产业园办公空间·现代简约", category="工程",
                  summary="模块储物与极简家具服务高效办公。",
                  content="办公区以模块储物柜按团队自由组合，实木书桌支撑居家办公切换，整体强调秩序与安静。",
                  images=[], is_new=False, sort_order=4),
            Cases(title="老城改护公寓·新中式", category="工程",
                  summary="罗汉床与胡桃木家具适配适老空间。",
                  content="适老公寓以新中式家具的低姿、圆角与安全材质为主，罗汉床兼顾起居与小憩。",
                  images=[], is_new=False, sort_order=5),
        ])
        db.commit()

    # 新闻（status 须为 published 才会被前台列出）
    if db.query(News).count() == 0:
        db.add_all([
            News(title="Rz家居 2026 秋季新品发布会圆满落幕", category="company",
                 summary="现代简约与北欧自然两大系列同步亮相。",
                 content="本次发布会集中呈现云朵沙发、羊毛休闲椅等新品，并宣布全线采用 FSC 认证木材，践行可持续制造。",
                 author="品牌中心", published_at=now, is_top=True, status="published"),
            News(title="Rz家居入选年度绿色制造示范企业", category="company",
                 summary="工厂光伏改造与水性涂装获认可。",
                 content="通过对涂装线与厂房屋顶光伏的改造，单位产品碳排放同比下降 18%，获评示范企业。",
                 author="行政部", published_at=datetime(2026, 7, 12, 0, 0, 0, tzinfo=timezone.utc),
                 is_top=False, status="published"),
            News(title="行业观察：存量房时代的整屋定制机会", category="industry",
                 summary="旧房翻新带动一站式家居消费。",
                 content="随着存量房占比提升，消费者更倾向风格统一、交付省心的整屋方案，给制造与服务体系提出新命题。",
                 author="行业研究", published_at=datetime(2026, 6, 20, 0, 0, 0, tzinfo=timezone.utc),
                 is_top=False, status="published"),
            News(title="趋势｜低饱和色调正成为主流", category="industry",
                 summary="燕麦、暖灰、原木色走俏。",
                 content="调研显示，低饱和中性色更易与既有软装协调，也更易营造长期耐看的居家氛围。",
                 author="趋势研究", published_at=datetime(2026, 5, 8, 0, 0, 0, tzinfo=timezone.utc),
                 is_top=False, status="published"),
        ])
        db.commit()

    # 轮播
    if db.query(Banner).count() == 0:
        db.add_all([
            Banner(title="现代简约系列上新", image="", link_url="/products?series_id=1", sort_order=1),
            Banner(title="北欧自然·温暖居所", image="", link_url="/products?series_id=3", sort_order=2),
            Banner(title="新中式·东方意境", image="", link_url="/products?series_id=2", sort_order=3),
        ])
        db.commit()

    # 发展历程
    if db.query(Milestone).count() == 0:
        db.add_all([
            Milestone(year="1953", title="品牌创立", description="以一把实木圈椅起步，奠定匠心基因。", sort_order=1),
            Milestone(year="1985", title="自建工厂", description="引入标准化产线，品质全程可控。", sort_order=2),
            Milestone(year="2001", title="全国布局", description="零售网络覆盖主要城市，服务走近千家。", sort_order=3),
            Milestone(year="2010", title="设计驱动", description="组建独立设计中心，从制造走向创造。", sort_order=4),
            Milestone(year="2020", title="绿色制造", description="厂区光伏与水性涂装落地，迈向可持续。", sort_order=5),
        ])
        db.commit()

    # 关于板块（overview / brand）
    if db.query(AboutSection).count() == 0:
        db.add_all([
            AboutSection(code="overview", title="关于 Rz家居",
                         content="Rz家居始于 1953 年，专注实木与软体家具的研发制造，坚持设计驱动与绿色制造，为家庭与空间提供经得起时间的家居方案。",
                         sort_order=1),
            AboutSection(code="brand", title="品牌理念",
                         content="我们相信，好的家居应当安静地服务于生活。Rz以克制的形式、可靠的材质与温润的触感，让日常回归从容。",
                         sort_order=2),
        ])
        db.commit()

    # 招聘
    if db.query(Job).count() == 0:
        db.add_all([
            Job(type="social", title="资深家具结构工程师", department="研发", city="杭州",
                salary="25–40K·13薪", headcount=2,
                description="负责实木/软体家具结构设计与打样跟进。",
                requirements="本科及以上，5 年以上家具结构经验，熟悉木材与五金特性。"),
            Job(type="social", title="空间陈列设计师", department="品牌", city="上海",
                salary="18–28K", headcount=1,
                description="负责门店与展会空间陈列方案落地。",
                requirements="3 年以上陈列/软装经验，有家居行业背景优先。"),
            Job(type="campus", title="管培生（制造方向）", department="供应链", city="湖州",
                salary="面议", headcount=5,
                description="轮岗生产、质量、计划，培养制造管理人才。",
                requirements="2026 届本科及以上，专业不限，踏实肯学。"),
            Job(type="campus", title="设计管培生", department="设计中心", city="杭州",
                salary="面议", headcount=3,
                description="参与产品线设计，跟随资深设计师成长。",
                requirements="工业设计/家具设计相关专业，作品集优先。"),
        ])
        db.commit()
